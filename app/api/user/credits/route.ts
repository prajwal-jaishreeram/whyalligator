import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getPayment } from "@/lib/dodo";

export const runtime = "nodejs";

export async function GET(request: Request) {
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
      return NextResponse.json({ credits: 0, hasActiveSlot: false });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id")?.trim();

    // If returning from checkout with a payment_id, verify payment on the fly
    if (paymentId) {
      const { data: existingSlot } = await supabase
        .from("pending_listings")
        .select("id")
        .filter("payload->>payment_id", "eq", paymentId)
        .maybeSingle();

      if (!existingSlot) {
        const paymentData = await getPayment(paymentId);
        const paymentStatus = paymentData?.status || paymentData?.data?.status;
        const targetUserId =
          paymentData?.metadata?.user_id ||
          paymentData?.data?.metadata?.user_id ||
          userId;

        if (paymentStatus === "succeeded") {
          await supabase.from("pending_listings").insert({
            payload: {
              type: "paid_slot",
              user_id: targetUserId,
              payment_id: paymentId,
              email: userEmail || "",
              created_at: new Date().toISOString(),
            },
          });
        }
      }
    }

    // Check unconsumed paid slots for this user
    const { data: slots, error } = await supabase
      .from("pending_listings")
      .select("id, payload, created_at")
      .filter("payload->>type", "eq", "paid_slot")
      .filter("payload->>user_id", "eq", userId)
      .is("consumed_at", null);

    if (error) {
      console.error("Error querying user credits:", error);
      return NextResponse.json({ credits: 0, hasActiveSlot: false });
    }

    const count = slots?.length || 0;
    return NextResponse.json({
      credits: count,
      hasActiveSlot: count > 0,
      slots: slots || [],
    });
  } catch (error) {
    console.error("Error in credits route:", error);
    return NextResponse.json({ credits: 0, hasActiveSlot: false }, { status: 500 });
  }
}
