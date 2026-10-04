import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

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
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (compErr || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Fetch comments
    const { data: comments, error: commErr } = await admin
      .from("company_comments")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: true });

    if (commErr) {
      throw commErr;
    }

    // Nest replies
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    (comments || []).forEach((c) => {
      commentMap.set(c.id, { ...c, replies: [] });
    });

    (comments || []).forEach((c) => {
      const fullComment = commentMap.get(c.id);
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id).replies.push(fullComment);
      } else {
        rootComments.push(fullComment);
      }
    });

    return NextResponse.json({ comments: rootComments });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load comments" },
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
        { error: "Please log in to post a comment." },
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
    const userEmail = (user.email ?? "").toLowerCase();
    const userUsername = user.user_metadata?.username || null;
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      userUsername ||
      userEmail.split("@")[0];

    const body = await request.json();
    const content = String(body.content ?? "").trim();
    const targetParentId = body.parent_id ? String(body.parent_id) : null;
    const explicitReplyTo = body.reply_to_username ? String(body.reply_to_username).replace(/^@/, "") : null;

    if (!content || content.length < 2) {
      return NextResponse.json(
        { error: "Comment must be at least 2 characters long." },
        { status: 400 }
      );
    }

    // Fetch company to check founder role
    const { data: company, error: compErr } = await admin
      .from("companies")
      .select("id, slug, company_name, user_id, email, partner_emails")
      .eq("slug", slug)
      .maybeSingle();

    if (compErr || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const partnerEmails: string[] = Array.isArray(company.partner_emails)
      ? company.partner_emails.map((e: unknown) => String(e).toLowerCase())
      : [];

    const isFounder =
      company.user_id === user.id ||
      company.email.toLowerCase() === userEmail ||
      partnerEmails.includes(userEmail);

    let resolvedParentId = targetParentId;
    let resolvedReplyTo = explicitReplyTo;
    let targetNotifyUserId: string | null = null;

    if (targetParentId) {
      // Look up target comment to determine root thread and reply notification recipient
      const { data: targetComment } = await admin
        .from("company_comments")
        .select("id, user_id, parent_id, user_name, user_username")
        .eq("id", targetParentId)
        .maybeSingle();

      if (targetComment) {
        targetNotifyUserId = targetComment.user_id;
        if (!resolvedReplyTo) {
          resolvedReplyTo = targetComment.user_username || targetComment.user_name;
        }
        // If target comment is already a reply, attach under the root parent thread so mobile thread doesn't nest infinitely
        if (targetComment.parent_id) {
          resolvedParentId = targetComment.parent_id;
        }
      }
    }

    const { data: newComment, error: insertErr } = await admin
      .from("company_comments")
      .insert({
        company_id: company.id,
        user_id: user.id,
        user_name: userName,
        user_username: userUsername,
        user_email: userEmail,
        content,
        parent_id: resolvedParentId,
        reply_to_username: resolvedReplyTo,
        is_founder: isFounder,
      })
      .select()
      .single();

    if (insertErr) {
      throw insertErr;
    }

    const authorTag = userUsername ? `@${userUsername}` : userName;
    const snippet = content.slice(0, 75) + (content.length > 75 ? "..." : "");

    // 1. Reply Notification
    if (targetNotifyUserId && targetNotifyUserId !== user.id) {
      await admin.from("user_notifications").insert({
        user_id: targetNotifyUserId,
        type: "reply",
        title: "New Reply to your comment",
        message: `${authorTag} replied: "${snippet}"`,
        link: `/companies/${company.slug || slug}`,
        metadata: { comment_id: newComment.id, company_id: company.id },
      });
    }
    // 2. New comment on company notification for founder
    else if (!targetParentId && company.user_id && company.user_id !== user.id) {
      await admin.from("user_notifications").insert({
        user_id: company.user_id,
        type: "new_comment",
        title: `New Comment on ${company.company_name}`,
        message: `${authorTag} commented: "${snippet}"`,
        link: `/companies/${company.slug || slug}`,
        metadata: { comment_id: newComment.id, company_id: company.id },
      });
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to post comment" },
      { status: 500 }
    );
  }
}
