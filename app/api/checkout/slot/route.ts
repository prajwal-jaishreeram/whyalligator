import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createCheckoutSession } from "@/lib/dodo";
import { siteUrl } from "@/lib/companies";

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

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "You must be signed in to unlock a listing slot." },
        { status: 401 }
      );
    }

    const session = await createCheckoutSession({
      email: userEmail,
      name: userEmail.split("@")[0] || "Founder",
      returnUrl: `${siteUrl()}/add?unlocked=1`,
      metadata: {
        user_id: userId,
        email: userEmail,
        type: "listing_slot",
      },
    });

    if (!session.checkout_url) {
      return NextResponse.json(
        { error: "Payment provider did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.checkout_url });
  } catch (error) {
    console.error("Failed to start slot checkout:", error);
    return NextResponse.json(
      { error: "Could not initiate payment. Please try again." },
      { status: 500 }
    );
  }
}
