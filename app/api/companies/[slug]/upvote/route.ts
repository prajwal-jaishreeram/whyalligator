import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendUpvoteMilestoneEmail, sendRankAchievementEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const admin = createAdminClient();

    // Fetch company
    const { data: company, error: compErr } = await admin
      .from("companies")
      .select("id, upvotes_count, created_at, user_id, email, partner_emails")
      .eq("slug", slug)
      .maybeSingle();

    if (compErr || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user is logged in and check vote & ownership status
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    let hasUpvoted = false;
    let isOwnCompany = false;
    if (token) {
      const { data: userData } = await admin.auth.getUser(token);
      if (userData?.user) {
        const uEmail = (userData.user.email ?? "").trim().toLowerCase();
        isOwnCompany = Boolean(
          (company.user_id && company.user_id === userData.user.id) ||
          (company.email && company.email.toLowerCase() === uEmail) ||
          (Array.isArray(company.partner_emails) &&
            company.partner_emails.map((e: string) => e.toLowerCase()).includes(uEmail))
        );

        const { data: vote } = await admin
          .from("company_upvotes")
          .select("id")
          .eq("company_id", company.id)
          .eq("user_id", userData.user.id)
          .maybeSingle();
        hasUpvoted = Boolean(vote);
      }
    }

    // Calculate rank among live companies
    const upvotes = company.upvotes_count || 0;
    const createdAt = company.created_at;

    const { count: higherCount } = await admin
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("status", "live")
      .gt("upvotes_count", upvotes);

    const { count: tieCount } = await admin
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("status", "live")
      .eq("upvotes_count", upvotes)
      .gt("created_at", createdAt || "");

    const rank = (higherCount ?? 0) + (tieCount ?? 0) + 1;

    return NextResponse.json({
      upvotes_count: upvotes,
      has_upvoted: hasUpvoted,
      is_own_company: isOwnCompany,
      rank: rank <= 10 ? rank : null,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch upvotes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const admin = createAdminClient();

    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json(
        { error: "Please log in or sign up to upvote." },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 }
      );
    }

    const user = userData.user;

    // Fetch company
    const { data: company, error: compErr } = await admin
      .from("companies")
      .select("id, upvotes_count, company_name, slug, user_id, email, partner_emails, created_at")
      .eq("slug", slug)
      .maybeSingle();

    if (compErr || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Strict validation: Users cannot upvote their own startup
    const userEmailClean = (user.email ?? "").trim().toLowerCase();
    const isOwnerOrPartner = Boolean(
      (company.user_id && company.user_id === user.id) ||
      (company.email && company.email.toLowerCase() === userEmailClean) ||
      (Array.isArray(company.partner_emails) &&
        company.partner_emails.map((e: string) => e.toLowerCase()).includes(userEmailClean))
    );

    if (isOwnerOrPartner) {
      return NextResponse.json(
        { error: "You cannot upvote your own startup." },
        { status: 403 }
      );
    }

    // Check existing vote
    const { data: existingVote } = await admin
      .from("company_upvotes")
      .select("id")
      .eq("company_id", company.id)
      .eq("user_id", user.id)
      .maybeSingle();

    let newHasUpvoted = false;
    if (existingVote) {
      // Toggle off / remove vote
      await admin
        .from("company_upvotes")
        .delete()
        .eq("id", existingVote.id);
      newHasUpvoted = false;
    } else {
      // Add vote
      await admin.from("company_upvotes").insert({
        company_id: company.id,
        user_id: user.id,
        user_email: user.email,
      });
      newHasUpvoted = true;
    }

    // Get fresh count
    const { count } = await admin
      .from("company_upvotes")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.id);

    const freshCount = count ?? 0;

    // Update company upvotes_count
    await admin
      .from("companies")
      .update({ upvotes_count: freshCount })
      .eq("id", company.id);

    // Create notifications if upvoted
    if (newHasUpvoted && company.user_id && company.user_id !== user.id) {
      const voterName =
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "A user";

      // 1. Regular Upvote Notification
      await admin.from("user_notifications").insert({
        user_id: company.user_id,
        type: "upvote",
        title: "New Upvote!",
        message: `@${voterName} upvoted ${company.company_name}. Total upvotes: ${freshCount}.`,
        link: `/companies/${company.slug || slug}`,
        metadata: { company_id: company.id, voter_id: user.id },
      });

      // 2. Milestone Notifications (e.g. 25, 50, 100)
      if ([25, 50, 100].includes(freshCount)) {
        await admin.from("user_notifications").insert({
          user_id: company.user_id,
          type: "milestone_100",
          title: `🎉 ${freshCount} Upvotes Milestone!`,
          message: `Congrats! ${company.company_name} crossed ${freshCount} upvotes on WhyAlligator!`,
          link: `/companies/${company.slug || slug}`,
          metadata: { milestone: freshCount, company_id: company.id },
        });

        if (company.email) {
          sendUpvoteMilestoneEmail({
            email: company.email,
            companyName: company.company_name,
            slug: company.slug || slug,
            upvotesCount: freshCount,
          }).catch((err) => console.error("Error sending milestone email", err));
        }
      }

      // 3. Top 3 Ranking Notification
      const { count: higherCount } = await admin
        .from("companies")
        .select("id", { count: "exact", head: true })
        .eq("status", "live")
        .gt("upvotes_count", freshCount);

      const newRank = (higherCount ?? 0) + 1;
      if (newRank <= 3) {
        await admin.from("user_notifications").insert({
          user_id: company.user_id,
          type: "top_3",
          title: `🏆 #${newRank} Top Company!`,
          message: `Congrats! ${company.company_name} is now ranked #${newRank} in Top Companies!`,
          link: `/companies/${company.slug || slug}`,
          metadata: { rank: newRank, company_id: company.id },
        });

        if (company.email) {
          sendRankAchievementEmail({
            email: company.email,
            companyName: company.company_name,
            slug: company.slug || slug,
            rank: newRank,
          }).catch((err) => console.error("Error sending rank achievement email", err));
        }
      }
    }

    return NextResponse.json({
      success: true,
      has_upvoted: newHasUpvoted,
      upvotes_count: freshCount,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process upvote" },
      { status: 500 }
    );
  }
}
