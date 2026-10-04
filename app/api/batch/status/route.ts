import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const admin = createAdminClient();
    const url = new URL(request.url);
    const simulate = url.searchParams.get("simulate"); // "open" | "countdown" | "completed"

    // 1. Fetch current milestone configuration
    let { data: milestone, error: milestoneErr } = await admin
      .from("batch_milestones")
      .select("*")
      .eq("batch_name", "Batch 1")
      .maybeSingle();

    if (milestoneErr || !milestone) {
      const { data: inserted } = await admin
        .from("batch_milestones")
        .insert({
          batch_name: "Batch 1",
          target_count: 3000,
          funding_amount: 30000,
          status: "open",
        })
        .select()
        .single();
      milestone = inserted || {
        batch_name: "Batch 1",
        target_count: 3000,
        funding_amount: 30000,
        status: "open",
      };
    }

    // 2. Count live startups in Batch 1
    const { count: liveCount } = await admin
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("status", "live");

    const totalListings = liveCount ?? 0;
    const targetCount = milestone.target_count || 3000;
    let currentStatus = milestone.status;
    let countdownEndsAt = milestone.countdown_ends_at ? new Date(milestone.countdown_ends_at).getTime() : null;
    let countdownStartedAt = milestone.countdown_started_at;

    // 3. Automatic transition: trigger 8-hour countdown if Batch 1 reaches 3,000 listings
    if (totalListings >= targetCount && currentStatus === "open") {
      const now = new Date();
      const endsAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
      countdownStartedAt = now.toISOString();
      countdownEndsAt = endsAt.getTime();
      currentStatus = "countdown";

      await admin
        .from("batch_milestones")
        .update({
          status: "countdown",
          countdown_started_at: countdownStartedAt,
          countdown_ends_at: endsAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("batch_name", "Batch 1");
    }

    // 4. Fetch the real-time top-voted startup
    const { data: leadingList } = await admin
      .from("companies")
      .select("id, slug, company_name, pitch, logo_url, upvotes_count, batch, is_batch_winner, winner_badge")
      .eq("status", "live")
      .order("upvotes_count", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1);

    const leadingCompany = leadingList?.[0] || null;

    // 5. Automatic transition: finalize winner when 8-hour countdown expires
    let winnerCompany = null;
    if (currentStatus === "countdown" && countdownEndsAt && Date.now() >= countdownEndsAt) {
      currentStatus = "completed";
      const now = new Date();

      if (leadingCompany) {
        // Automatically grant the winner badge
        await admin
          .from("companies")
          .update({
            is_batch_winner: true,
            winner_badge: "Batch 1 Winner • $30,000 Equity-Free",
          })
          .eq("id", leadingCompany.id);

        winnerCompany = {
          ...leadingCompany,
          is_batch_winner: true,
          winner_badge: "Batch 1 Winner • $30,000 Equity-Free",
        };

        await admin
          .from("batch_milestones")
          .update({
            status: "completed",
            winner_company_id: leadingCompany.id,
            winner_finalized_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("batch_name", "Batch 1");
      } else {
        await admin
          .from("batch_milestones")
          .update({
            status: "completed",
            winner_finalized_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("batch_name", "Batch 1");
      }
    } else if (currentStatus === "completed" && milestone.winner_company_id) {
      const { data: winComp } = await admin
        .from("companies")
        .select("id, slug, company_name, pitch, logo_url, upvotes_count, batch, is_batch_winner, winner_badge")
        .eq("id", milestone.winner_company_id)
        .maybeSingle();
      winnerCompany = winComp || leadingCompany;
    }

    const timeRemainingMs = countdownEndsAt ? Math.max(0, countdownEndsAt - Date.now()) : 0;

    return NextResponse.json({
      batch_name: "Batch 1",
      target_count: targetCount,
      total_listings: totalListings,
      funding_amount: milestone.funding_amount || 30000,
      status: currentStatus,
      countdown_started_at: countdownStartedAt,
      countdown_ends_at: milestone.countdown_ends_at,
      time_remaining_ms: timeRemainingMs,
      leading_company: leadingCompany,
      winner_company: winnerCompany,
      is_simulated: false,
    });
  } catch (err) {
    console.error("Error fetching batch status:", err);
    return NextResponse.json({ error: "Failed to fetch batch milestone status" }, { status: 500 });
  }
}
