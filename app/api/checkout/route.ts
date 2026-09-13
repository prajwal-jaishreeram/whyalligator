import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getStripe, LISTING_PRICE_CENTS } from "@/lib/stripe";
import { siteUrl } from "@/lib/companies";
import { parseListingForm } from "@/lib/listing";
import { uploadPublicImage } from "@/lib/storage";
import type { ListingPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const parsed = parseListingForm(form);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const logo = form.get("logo");
    if (!(logo instanceof File) || logo.size === 0) {
      return NextResponse.json({ error: "A logo image is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const logoUpload = await uploadPublicImage(supabase, logo, "pending");
    if ("error" in logoUpload) {
      return NextResponse.json({ error: logoUpload.error }, { status: 400 });
    }

    const payload: ListingPayload = {
      ...parsed.payload,
      logo_path: logoUpload.path,
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

    const { data: pending, error: pendingError } = await supabase
      .from("pending_listings")
      .insert({ payload })
      .select("id")
      .single();

    if (pendingError || !pending) {
      console.error(pendingError);
      return NextResponse.json(
        { error: "Could not save listing. Did you run the latest schema.sql?" },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const origin = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: payload.email,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/add?canceled=1`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: LISTING_PRICE_CENTS,
            product_data: {
              name: "WhyAlligator directory listing",
              description: payload.company_name,
            },
          },
        },
      ],
      metadata: {
        pending_id: pending.id,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not start checkout. Check server configuration." },
      { status: 500 },
    );
  }
}
