import { Resend } from "resend";
import { siteUrl } from "./companies";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function baseEmailWrapper(params: {
  headline: string;
  badge?: { text: string; bg: string; color: string };
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerTip?: string;
}): string {
  const ctaBlock =
    params.ctaText && params.ctaUrl
      ? `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: #111827;">
          <a href="${params.ctaUrl}" target="_blank" style="display: inline-block; padding: 13px 26px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; letter-spacing: -0.2px;">
            ${params.ctaText}
          </a>
        </td>
      </tr>
    </table>
  `
      : "";

  const badgeBlock = params.badge
    ? `
    <div style="display: inline-block; padding: 4px 10px; background-color: ${params.badge.bg}; color: ${params.badge.color}; font-size: 12px; font-weight: 700; border-radius: 20px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
      ${params.badge.text}
    </div>
  `
    : "";

  const tipBlock = params.footerTip
    ? `
    <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #71717a; border-top: 1px dashed #e2e2dc; padding-top: 16px;">
      💡 <strong>Tip:</strong> ${params.footerTip}
    </p>
  `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(params.headline)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #16140f; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5ee; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e2dc; border-radius: 8px; overflow: hidden; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); text-align: left;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 22px; border-bottom: 1px solid #f0f0ea;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; color: #16140f; letter-spacing: -0.6px;">WhyAlligator</span>
                    <span style="font-size: 12px; color: #71717a; margin-left: 8px;">🐊</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #a1a1aa; font-weight: 600;">Startup Directory</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding-top: 28px;">
              ${badgeBlock}
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.4px; line-height: 1.3;">
                ${params.headline}
              </h1>
              <div style="font-size: 15px; line-height: 1.6; color: #4e4e4e;">
                ${params.bodyHtml}
              </div>
              ${ctaBlock}
              ${tipBlock}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid #f0f0ea; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5;">
              © 2026 WhyAlligator. All rights reserved.<br>
              <a href="https://www.whyalligator.com" style="color: #71717a; text-decoration: underline;">whyalligator.com</a> &bull; The directory for bold startups.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "WhyAlligator <hello@whyalligator.com>";

  if (!apiKey) {
    console.log(`[Email Mock/Skip] To: ${params.to} | Subject: "${params.subject}"`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[Email Error] Failed sending to", params.to, error);
    }
  } catch (err) {
    console.error("[Email Error]", err);
  }
}

/**
 * 1. Startup Submission Received (Under review)
 */
export async function sendSubmissionReceivedEmail(input: {
  email: string;
  companyName: string;
  founderName?: string;
  pitch: string;
}): Promise<void> {
  const safeName = escapeHtml(input.companyName);
  const safeFounder = escapeHtml(input.founderName || "Founder");
  const safePitch = escapeHtml(input.pitch);

  const html = baseEmailWrapper({
    headline: `We received your startup submission: ${safeName} 🚀`,
    badge: { text: "Review in Progress", bg: "#eff6ff", color: "#1d4ed8" },
    bodyHtml: `
      <p>Hey ${safeFounder},</p>
      <p>Thank you for submitting <strong>${safeName}</strong> to WhyAlligator. Our curation team is reviewing your listing to make sure all links, batch tags, and logos look sharp.</p>
      <div style="background: #fdfdf8; border: 1px solid #e6e6dd; border-radius: 6px; padding: 14px 16px; margin: 18px 0;">
        <p style="margin: 0; font-size: 13px; color: #71717a;">Pitch preview:</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 500; color: #111827;">"${safePitch}"</p>
      </div>
      <p>Standard submissions go live within 24–48 hours. Fast-Track listings go live in under 2 hours.</p>
    `,
    ctaText: "Go to Founder Dashboard",
    ctaUrl: `${siteUrl()}/dashboard`,
  });

  await dispatchEmail({
    to: input.email,
    subject: `We received your submission: ${input.companyName}`,
    html,
  });
}

/**
 * 2. Startup Approved & Live on WhyAlligator!
 */
export async function sendListingConfirmation(input: {
  email: string;
  companyName: string;
  slug: string;
}): Promise<void> {
  const safeName = escapeHtml(input.companyName);
  const link = `${siteUrl()}/companies/${input.slug}`;

  const html = baseEmailWrapper({
    headline: `${safeName} is officially LIVE on WhyAlligator! 🐊`,
    badge: { text: "Now Live", bg: "#ecfdf5", color: "#047857" },
    bodyHtml: `
      <p>Congratulations! Your startup <strong>${safeName}</strong> is now published in the WhyAlligator directory and open for discovery and founder upvotes.</p>
      <p>Share your listing with your community, customers, and investors to climb the rankings and reach the Top 3 leaderboard!</p>
    `,
    ctaText: "View Your Live Listing",
    ctaUrl: link,
    footerTip:
      "Remember to keep your startup details accurate before reaching 25 upvotes. After 25 upvotes, core details lock to maintain directory trust and ranking integrity.",
  });

  await dispatchEmail({
    to: input.email,
    subject: `🎉 ${input.companyName} is live on WhyAlligator`,
    html,
  });
}

/**
 * 3. Upvote Milestone Reached (e.g., 25, 50, 100)
 */
export async function sendUpvoteMilestoneEmail(input: {
  email: string;
  companyName: string;
  slug: string;
  upvotesCount: number;
}): Promise<void> {
  const safeName = escapeHtml(input.companyName);
  const link = `${siteUrl()}/companies/${input.slug}`;

  const html = baseEmailWrapper({
    headline: `🔥 ${input.upvotesCount} Upvotes Milestone Reached!`,
    badge: { text: `${input.upvotesCount} Upvotes`, bg: "#ffedd5", color: "#c2410c" },
    bodyHtml: `
      <p>Awesome momentum! <strong>${safeName}</strong> just crossed ${input.upvotesCount} upvotes on WhyAlligator.</p>
      <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 14px 16px; margin: 18px 0;">
        <p style="margin: 0; font-size: 13px; color: #9a3412; font-weight: 700;">Verified Startup Milestone</p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #c2410c;">
          ${
            input.upvotesCount >= 25
              ? "Your startup has unlocked verified rank momentum. Core name and URL details are now locked to preserve ranking integrity."
              : "Keep spreading the word to reach the 25 upvotes milestone!"
          }
        </p>
      </div>
    `,
    ctaText: "Check Your Ranking",
    ctaUrl: link,
  });

  await dispatchEmail({
    to: input.email,
    subject: `🔥 ${input.upvotesCount} Upvotes Milestone: ${input.companyName}`,
    html,
  });
}

/**
 * 4. Reached Top 3 / Leaderboard Alert
 */
export async function sendRankAchievementEmail(input: {
  email: string;
  companyName: string;
  slug: string;
  rank: number;
}): Promise<void> {
  const safeName = escapeHtml(input.companyName);

  const html = baseEmailWrapper({
    headline: `🏆 ${safeName} reached Rank #${input.rank}!`,
    badge: { text: `Rank #${input.rank} Top Company`, bg: "#fef3c7", color: "#b45309" },
    bodyHtml: `
      <p>Big news! <strong>${safeName}</strong> is currently ranked <strong>#${input.rank}</strong> on WhyAlligator's top startups leaderboard!</p>
      <p>Your badge is featured prominently across the home directory cards and company spotlight.</p>
    `,
    ctaText: "See Leaderboard",
    ctaUrl: siteUrl(),
  });

  await dispatchEmail({
    to: input.email,
    subject: `🏆 ${input.companyName} is now Rank #${input.rank} on WhyAlligator!`,
    html,
  });
}

/**
 * 5. New Comment on Startup Page
 */
export async function sendNewCommentEmail(input: {
  email: string;
  companyName: string;
  slug: string;
  authorName: string;
  commentSnippet: string;
}): Promise<void> {
  const safeName = escapeHtml(input.companyName);
  const safeAuthor = escapeHtml(input.authorName);
  const safeSnippet = escapeHtml(input.commentSnippet);
  const link = `${siteUrl()}/companies/${input.slug}#comments`;

  const html = baseEmailWrapper({
    headline: `New comment on ${safeName}`,
    badge: { text: "Community Discussion", bg: "#f3f4f6", color: "#374151" },
    bodyHtml: `
      <p><strong>${safeAuthor}</strong> left a comment on your startup page:</p>
      <div style="background: #fdfdf8; border-left: 3px solid #111827; padding: 12px 16px; margin: 18px 0; font-style: italic; color: #374151; font-size: 14px;">
        "${safeSnippet}"
      </div>
      <p>Engage back with your visitors and early supporters by replying on your listing.</p>
    `,
    ctaText: "Reply on WhyAlligator",
    ctaUrl: link,
  });

  await dispatchEmail({
    to: input.email,
    subject: `💬 New comment on ${input.companyName} from ${input.authorName}`,
    html,
  });
}

/**
 * 6. Official Batch Champion & $30,000 Equity-Free Grant Winner Announcement
 */
export async function sendWinnerCongratulationsEmail(input: {
  email: string;
  companyName: string;
  slug: string;
  batchName: string;
  grantAmount: number;
  upvotesCount: number;
}): Promise<void> {
  const safeName = escapeHtml(input.companyName);
  const link = `${siteUrl()}/companies/${input.slug}`;
  const formattedGrant = `$${input.grantAmount.toLocaleString()}`;

  const html = baseEmailWrapper({
    headline: `🏆 Congratulations! ${safeName} has won the ${input.batchName} Grant!`,
    badge: { text: `Official ${input.batchName} Winner`, bg: "#fef3c7", color: "#92400e" },
    bodyHtml: `
      <p style="font-size: 16px; line-height: 1.6; color: #111827;">
        The community countdown has officially concluded, and <strong>${safeName}</strong> finished as the <strong>#1 most upvoted startup with ${input.upvotesCount} community votes</strong>!
      </p>
      <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1.5px solid #fde68a; border-radius: 8px; padding: 20px 24px; margin: 24px 0; text-align: center;">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #92400e; font-weight: 700; display: block; margin-bottom: 6px;">
          Milestone Award
        </span>
        <span style="font-size: 32px; font-weight: 800; color: #b45309; display: block; letter-spacing: -0.5px;">
          ${formattedGrant} Equity-Free
        </span>
        <span style="font-size: 13px; color: #78350f; display: block; margin-top: 6px;">
          Zero equity taken &bull; Direct founder grant &bull; Permanent Champion badge
        </span>
      </div>
      <p>
        Your startup has been awarded the permanent <strong>"${input.batchName} Winner"</strong> trophy badge across the directory homepage, category rankings, and your official profile.
      </p>
      <p>
        Our team will follow up via this email address (<strong>${escapeHtml(input.email)}</strong>) to verify your payout details and schedule the fund disbursement.
      </p>
    `,
    ctaText: "View Your Champion Listing",
    ctaUrl: link,
    footerTip: "Keep your founder profile and contact information updated in the dashboard to ensure seamless disbursement verification.",
  });

  await dispatchEmail({
    to: input.email,
    subject: `🏆 Congratulations! ${input.companyName} won the ${input.batchName} ${formattedGrant} Grant!`,
    html,
  });
}

