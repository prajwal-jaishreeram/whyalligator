import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

const RESERVED_SLUGS = new Set([
  "new",
  "edit",
  "api",
  "admin",
  "jobs",
  "about",
  "login",
  "signup",
  "dashboard",
  "resources",
  "companies",
  "static",
  "_next",
  "favicon.ico",
  "sitemap.xml",
  "robots.txt",
  "check-slug",
]);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const admin = createAdminClient();

    // Verify company exists (match by slug or id)
    const { data: company, error: fetchError } = await admin
      .from("companies")
      .select("id, user_id, email, slug, partner_emails, company_name, website_url, upvotes_count")
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle();

    if (fetchError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing authentication token" }, { status: 401 });
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const user = userData.user;
    const userEmail = (user.email ?? "").toLowerCase();
    const partnerEmails: string[] = Array.isArray(company.partner_emails)
      ? company.partner_emails.map((e: unknown) => String(e).toLowerCase())
      : [];

    const isOwnerOrPartner =
      company.user_id === user.id ||
      company.email.toLowerCase() === userEmail ||
      partnerEmails.includes(userEmail);

    if (!isOwnerOrPartner) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to edit this listing" }, { status: 403 });
    }

    // Update fields (excluding is_top_company, status, stripe_session_id, payment_id)
    const updateData: Record<string, unknown> = {};
    if (typeof body.company_name === "string") updateData.company_name = body.company_name.trim();
    if (typeof body.logo_url === "string") updateData.logo_url = body.logo_url.trim();
    if (typeof body.pitch === "string") updateData.pitch = body.pitch.trim();
    if (typeof body.description === "string") updateData.description = body.description.trim();
    if (typeof body.website_url === "string") updateData.website_url = body.website_url.trim();
    if (typeof body.location === "string") updateData.location = body.location.trim();
    if (typeof body.founded_year === "string") updateData.founded_year = body.founded_year.trim();
    if (typeof body.team_size === "string") updateData.team_size = body.team_size.trim();
    if (typeof body.activity_status === "string") updateData.activity_status = body.activity_status.trim();
    if (Array.isArray(body.industries)) updateData.industries = body.industries.slice(0, 3);
    if (typeof body.linkedin_url === "string") updateData.linkedin_url = body.linkedin_url.trim();
    if (typeof body.twitter_url === "string") updateData.twitter_url = body.twitter_url.trim();
    if (typeof body.primary_partner === "string") updateData.primary_partner = body.primary_partner.trim();
    if (typeof body.hq_region === "string") updateData.hq_region = body.hq_region.trim();
    if (typeof body.is_nonprofit === "boolean") updateData.is_nonprofit = body.is_nonprofit;
    if (Array.isArray(body.founders)) updateData.founders = body.founders;
    if (Array.isArray(body.jobs)) updateData.jobs = body.jobs;
    if (Array.isArray(body.extra_links)) updateData.extra_links = body.extra_links;
    if (Array.isArray(body.partner_emails)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      updateData.partner_emails = body.partner_emails
        .map((e: unknown) => String(e).trim().toLowerCase())
        .filter((e: string) => emailRegex.test(e) && e !== company.email.toLowerCase())
        .slice(0, 10);
    }
    if (!company.user_id) {
      updateData.user_id = user.id; // Claim ownership if not yet linked
    }

    // Company username / custom URL slug update
    if (typeof body.slug === "string") {
      const cleanSlug = body.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (cleanSlug.length < 2 || cleanSlug.length > 50) {
        return NextResponse.json(
          { error: "Company username/URL must be between 2 and 50 characters." },
          { status: 400 }
        );
      }

      if (RESERVED_SLUGS.has(cleanSlug)) {
        return NextResponse.json(
          { error: `The username "${cleanSlug}" is reserved. Please pick another name.` },
          { status: 400 }
        );
      }

      if (cleanSlug !== company.slug) {
        const { data: existingCompany } = await admin
          .from("companies")
          .select("id")
          .eq("slug", cleanSlug)
          .neq("id", company.id)
          .maybeSingle();

        if (existingCompany) {
          return NextResponse.json(
            { error: `The company username "${cleanSlug}" is already taken.` },
            { status: 409 }
          );
        }

        updateData.slug = cleanSlug;
      }
    }

    // Rule: After reaching 25 upvotes, if user edits company_name or website_url,
    // their upvotes, comments, and rank are reset back to 0.
    const currentUpvotes = Number(company.upvotes_count) || 0;
    let resetOccurred = false;

    if (currentUpvotes >= 25) {
      const cleanUrl = (u: string) =>
        u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

      const originalName = (company.company_name || "").trim().toLowerCase();
      const updatedName = typeof updateData.company_name === "string" ? updateData.company_name.toLowerCase() : originalName;

      const originalUrl = cleanUrl(company.website_url || "");
      const updatedUrl = typeof updateData.website_url === "string" ? cleanUrl(updateData.website_url) : originalUrl;

      const nameChanged = updatedName !== originalName;
      const urlChanged = updatedUrl !== originalUrl;

      if (nameChanged || urlChanged) {
        resetOccurred = true;
        updateData.upvotes_count = 0;
        updateData.is_top_company = false;

        // Delete all company upvotes and comments
        await Promise.all([
          admin.from("company_upvotes").delete().eq("company_id", company.id),
          admin.from("company_comments").delete().eq("company_id", company.id),
        ]);
      }
    }

    const { error: updateError } = await admin
      .from("companies")
      .update(updateData)
      .eq("id", company.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }

    const finalSlug = (updateData.slug as string) || company.slug || slug;
    revalidatePath("/");
    revalidatePath("/companies");
    revalidatePath(`/companies/${slug}`);
    revalidatePath(`/companies/${finalSlug}`);

    return NextResponse.json({ success: true, slug: finalSlug, resetTriggered: resetOccurred });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
