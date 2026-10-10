import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase";
import { verifyWebhook } from "@/lib/dodo";
import { sendListingConfirmation } from "@/lib/email";
import { getBatchName, siteUrl } from "@/lib/companies";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { ListingPayload } from "@/lib/types";

export const runtime = "nodejs";

type DodoWebhookEvent = {
  type: string;
  data?: {
    payment_id?: string;
    status?: string;
    metadata?: Record<string, string>;
  };
};

export async function POST(request: Request) {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing DODO_PAYMENTS_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const rawBody = await request.text();

  let valid = false;
  try {
    valid = await verifyWebhook(rawBody, request.headers);
  } catch (error) {
    console.error(error);
  }
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: DodoWebhookEvent;
  try {
    event = JSON.parse(rawBody) as DodoWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "payment.succeeded") {
    return NextResponse.json({ received: true });
  }

  const paymentId = event.data?.payment_id?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }
  if (event.data?.status && event.data.status !== "succeeded") {
    return NextResponse.json({ received: true, skipped: "unpaid" });
  }

  const supabase = createAdminClient();

  // If this payment was for unlocking a listing slot
  if (event.data?.metadata?.type === "listing_slot") {
    const userId = event.data?.metadata?.user_id;
    const { data: existingSlot } = await supabase
      .from("pending_listings")
      .select("id")
      .filter("payload->>payment_id", "eq", paymentId)
      .maybeSingle();

    if (!existingSlot) {
      await supabase.from("pending_listings").insert({
        payload: {
          type: "paid_slot",
          user_id: userId,
          payment_id: paymentId,
          email: event.data?.metadata?.email || "",
          created_at: new Date().toISOString(),
        },
      });
    }
    return NextResponse.json({ received: true, slot: true });
  }

  const pendingId = event.data?.metadata?.pending_id?.trim();

  // Idempotency: Dodo may retry the same event.
  const { data: existing } = await supabase
    .from("companies")
    .select("id, slug")
    .eq("payment_id", paymentId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, id: existing.id, slug: existing.slug });
  }

  let payload: ListingPayload | null = null;
  if (pendingId) {
    const { data: pending, error: pendingError } = await supabase
      .from("pending_listings")
      .select("payload, consumed_at")
      .eq("id", pendingId)
      .maybeSingle();
    if (pendingError) {
      console.error(pendingError);
    }
    if (pending?.consumed_at) {
      return NextResponse.json({ received: true, skipped: "already_consumed" });
    }
    payload = (pending?.payload as ListingPayload) ?? null;
  }

  if (!payload) {
    return NextResponse.json({ error: "Missing pending listing" }, { status: 400 });
  }

  const logo_url = payload.logo_path
    ? supabase.storage.from("logos").getPublicUrl(payload.logo_path).data.publicUrl
    : null;

  const { data: slugs } = await supabase.from("companies").select("slug");
  const slug = uniqueSlug(
    slugify(payload.company_name),
    (slugs ?? []).map((row) => String(row.slug ?? "")),
  );

  const { count: currentTotal } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });

  const assignedBatch = payload.batch && payload.batch !== "The Other 99%"
    ? payload.batch
    : getBatchName(currentTotal ?? 0);

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
      user_id: payload.user_id ?? null,
      partner_emails: payload.partner_emails ?? [],
      extra_links: payload.extra_links ?? [],
      status: "live",
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    console.error(error);
    return NextResponse.json({ error: "Database insert failed" }, { status: 500 });
  }

  if (pendingId) {
    await supabase
      .from("pending_listings")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", pendingId);
  }

  await sendListingConfirmation({
    email: payload.email,
    companyName: payload.company_name,
    slug: data.slug,
  });

  revalidatePath("/");
  revalidatePath("/success");
  revalidatePath(`/companies/${data.slug}`);

  return NextResponse.json({
    received: true,
    id: data.id,
    card: `${siteUrl()}/companies/${data.slug}`,
  });
}
