import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase";
import { parseListingForm } from "@/lib/listing";
import { uploadPublicImage } from "@/lib/storage";
import { sendListingConfirmation } from "@/lib/email";
import { getBatchName, siteUrl } from "@/lib/companies";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { ListingPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.replace(/^bearer\s+/i, "").trim();
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user?.id) {
        userId = userData.user.id;
        userEmail = userData.user.email || null;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to publish a startup." },
        { status: 401 }
      );
    }

    // Verify user has an unconsumed paid slot
    const { data: slot, error: slotError } = await supabase
      .from("pending_listings")
      .select("id, payload")
      .filter("payload->>type", "eq", "paid_slot")
      .filter("payload->>user_id", "eq", userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: "No available paid listing slot. Please pay $20 first to unlock listing." },
        { status: 403 }
      );
    }

    const form = await request.formData();
    const parsed = parseListingForm(form);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const logo = form.get("logo");
    if (!(logo instanceof File) || logo.size === 0) {
      return NextResponse.json({ error: "A logo image is required." }, { status: 400 });
    }

    const logoUpload = await uploadPublicImage(supabase, logo, "logos");
    if ("error" in logoUpload) {
      return NextResponse.json({ error: logoUpload.error }, { status: 400 });
    }

    const payload: ListingPayload = {
      ...parsed.payload,
      logo_path: logoUpload.path,
      user_id: userId,
      email: userEmail || parsed.payload.email,
    };

    for (let i = 0; i < payload.founders.length; i += 1) {
      const photo = form.get(`founder_photo_${i}`);
      if (photo instanceof File && photo.size > 0) {
        const uploaded = await uploadPublicImage(supabase, photo, "founders");
        if ("error" in uploaded) {
          return NextResponse.json({ error: uploaded.error }, { status: 400 });
        }
        payload.founders[i] = {
          ...payload.founders[i],
          photo_url: uploaded.publicUrl,
        };
      }
    }

    const logo_url = logoUpload.publicUrl;

    const { data: slugs } = await supabase.from("companies").select("slug");
    const slug = uniqueSlug(
      slugify(payload.company_name),
      (slugs ?? []).map((row) => String(row.slug ?? ""))
    );

    const { count: currentTotal } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    const assignedBatch =
      payload.batch && payload.batch !== "The Other 99%"
        ? payload.batch
        : getBatchName(currentTotal ?? 0);

    const paymentId = (slot.payload as any)?.payment_id || null;

    const { data, error } = await supabase
      .from("companies")
      .insert({
        payment_id: paymentId,
        slug,
        company_name: payload.company_name,
        pitch: payload.pitch,
        description: payload.description,
        website_url: payload.website_url,
        logo_url,
        email: payload.email,
        location: payload.location,
        founded_year: payload.founded_year,
        team_size: payload.team_size,
        batch: assignedBatch,
        activity_status: payload.activity_status,
        industries: payload.industries,
        linkedin_url: payload.linkedin_url,
        twitter_url: payload.twitter_url,
        primary_partner: payload.primary_partner,
        founders: payload.founders,
        jobs: payload.jobs,
        hq_region: payload.hq_region,
        is_nonprofit: payload.is_nonprofit,
        is_top_company: false,
        user_id: userId,
        partner_emails: payload.partner_emails ?? [],
        extra_links: payload.extra_links ?? [],
        status: "live",
      })
      .select("id, slug")
      .single();

    if (error || !data) {
      console.error("Database insert error:", error);
      return NextResponse.json({ error: "Failed to create company." }, { status: 500 });
    }

    // Mark slot as consumed
    await supabase
      .from("pending_listings")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", slot.id);

    // Send confirmation email
    await sendListingConfirmation({
      email: payload.email,
      companyName: payload.company_name,
      companySlug: data.slug,
      batch: assignedBatch,
      websiteUrl: `${siteUrl()}/companies/${data.slug}`,
    }).catch((err) => console.error("Email error:", err));

    revalidatePath("/");
    revalidatePath(`/companies/${data.slug}`);

    return NextResponse.json({
      success: true,
      id: data.id,
      slug: data.slug,
      url: `/companies/${data.slug}`,
    });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json(
      { error: "Could not publish startup. Please check your connection." },
      { status: 500 }
    );
  }
}
