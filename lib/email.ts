import { Resend } from "resend";
import { siteUrl } from "./companies";

export async function sendListingConfirmation(input: {
  email: string;
  companyName: string;
  slug: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn("Resend is not configured; skipping confirmation email.");
    return;
  }

  const link = `${siteUrl()}/companies/${input.slug}`;
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: input.email,
    subject: `${input.companyName} is live on WhyAlligator`,
    html: `
      <div style="font-family: Georgia, 'Source Serif 4', serif; color: #111; line-height: 1.5;">
        <p>You're in the other 99%.</p>
        <p><strong>${escapeHtml(input.companyName)}</strong> is now listed on WhyAlligator.</p>
        <p><a href="${link}">See your company page</a></p>
        <p style="color:#666;font-size:14px;">Y Combinator accepts 1%. We accept the other 99%.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send confirmation email", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
