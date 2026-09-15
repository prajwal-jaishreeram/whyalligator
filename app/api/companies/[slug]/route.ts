import { NextResponse } from "next/server";
import { createAdminClient, createBrowserClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const admin = createAdminClient();

    // Verify company exists
    const { data: company, error: fetchError } = await admin
      .from("companies")
      .select("id, user_id, email, slug")
      .eq("slug", slug)
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
    const isOwner =
      company.user_id === user.id ||
      company.email.toLowerCase() === (user.email ?? "").toLowerCase();

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden: You do not own this listing" }, { status: 403 });
    }

    // Update fields (excluding is_top_company, status, stripe_session_id)
    const updateData: Record<string, unknown> = {};
    if (typeof body.company_name === "string") updateData.company_name = body.company_name.trim();
    if (typeof body.pitch === "string") updateData.pitch = body.pitch.trim();
    if (typeof body.description === "string") updateData.description = body.description.trim();
    if (typeof body.website_url === "string") updateData.website_url = body.website_url.trim();
    if (typeof body.location === "string") updateData.location = body.location.trim();
    if (typeof body.founded_year === "string") updateData.founded_year = body.founded_year.trim();
    if (typeof body.team_size === "string") updateData.team_size = body.team_size.trim();
    if (typeof body.activity_status === "string") updateData.activity_status = body.activity_status.trim();
    if (Array.isArray(body.industries)) updateData.industries = body.industries;
    if (typeof body.linkedin_url === "string") updateData.linkedin_url = body.linkedin_url.trim();
    if (typeof body.twitter_url === "string") updateData.twitter_url = body.twitter_url.trim();
    if (typeof body.primary_partner === "string") updateData.primary_partner = body.primary_partner.trim();
    if (typeof body.hq_region === "string") updateData.hq_region = body.hq_region.trim();
    if (typeof body.is_nonprofit === "boolean") updateData.is_nonprofit = body.is_nonprofit;
    if (Array.isArray(body.founders)) updateData.founders = body.founders;
    if (Array.isArray(body.jobs)) updateData.jobs = body.jobs;
    if (!company.user_id) {
      updateData.user_id = user.id; // Claim ownership if not yet linked
    }

    const { error: updateError } = await admin
      .from("companies")
      .update(updateData)
      .eq("id", company.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }

    revalidatePath("/");
    revalidatePath(`/companies/${slug}`);

    return NextResponse.json({ success: true, slug });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
