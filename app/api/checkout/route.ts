import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createCheckoutSession } from "@/lib/dodo";
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

    let userId: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.replace(/^bearer\s+/i, "").trim();
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user?.id) {
        userId = userData.user.id;
      }
    }
    if (!userId && form.get("user_id")) {
      userId = String(form.get("user_id")).trim() || null;
    }

    const payload: ListingPayload = {
      ...parsed.payload,
      logo_path: logoUpload.path,
      user_id: userId,
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

    const session = await createCheckoutSession({
      email: payload.email,
      name: payload.founders[0]?.name || payload.company_name,
      // Dodo appends ?payment_id=...&status=... to this URL.
      returnUrl: `${siteUrl()}/success`,
      metadata: {
        pending_id: String(pending.id),
        company_name: payload.company_name,
      },
    });

    if (!session.checkout_url) {
      return NextResponse.json(
        { error: "Payment provider did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.checkout_url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not start checkout. Check server configuration." },
      { status: 500 },
    );
  }
}
