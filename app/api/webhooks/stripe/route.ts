import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { sendListingConfirmation } from "@/lib/email";
import { getBatchName, siteUrl } from "@/lib/companies";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { ListingPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return NextResponse.json({ received: true, skipped: "unpaid" });
  }

  const supabase = createAdminClient();
  const pendingId = session.metadata?.pending_id?.trim();

  const { data: existing } = await supabase
    .from("companies")
    .select("id, slug")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, id: existing.id, slug: existing.slug });
  }

  let payload: ListingPayload | null = null;
  if (pendingId) {
    const { data: pending, error: pendingError } = await supabase
      .from("pending_listings")
      .select("payload")
      .eq("id", pendingId)
      .maybeSingle();
    if (pendingError) {
      console.error(pendingError);
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
      stripe_session_id: session.id,
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
