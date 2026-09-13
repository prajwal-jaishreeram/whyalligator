import type { Metadata } from "next";
import { ProsePage } from "@/components/ProsePage";

export const metadata: Metadata = {
  title: "Terms of Use | WhyAlligator",
};

export default function TermsPage() {
  return (
    <ProsePage title="Terms of Use">
      <p>Last updated: September 13, 2026</p>
      <p>
        These terms govern use of WhyAlligator, a satirical public directory
        where anyone can list a startup for a one-time $20 payment. By using
        the site or paying for a listing, you agree to them.
      </p>
      <h2>The service</h2>
      <p>
        WhyAlligator is not Y Combinator, not an accelerator, and not an offer
        of investment. A listing is advertising space on this website. We do
        not review product quality, incorporate your company, or take equity.
      </p>
      <h2>Listings and payment</h2>
      <ul>
        <li>The current price is a flat $20 USD, charged once by Stripe.</li>
        <li>
          After Stripe confirms payment, we publish the information you submitted
          on a public company page, newest listings first.
        </li>
        <li>
          You must have the right to use every name, logo, photo, and claim you
          upload. You grant us a license to host and display that content.
        </li>
        <li>
          Payments are generally non-refundable once the listing is live, except
          where the law requires a refund or we fail to publish after a
          successful charge.
        </li>
      </ul>
      <h2>Your responsibilities</h2>
      <p>
        Do not post illegal content, impersonate another company, upload malware,
        scrape the directory in a way that harms the service, or use the site to
        phish or harass anyone. We may remove a listing or refuse service if we
        reasonably believe these terms were broken.
      </p>
      <h2>No professional advice</h2>
      <p>
        Pages on this site are not legal, tax, or investment advice. Job posts
        are supplied by the listing company. Apply at your own risk.
      </p>
      <h2>Disclaimer and limit of liability</h2>
      <p>
        The site is provided “as is.” To the fullest extent allowed by law, we
        are not liable for lost profits, lost data, or indirect damages, and
        our total liability for a claim is limited to the amount you paid us
        in the 12 months before the claim (often $20).
      </p>
      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, without regard to
        conflict-of-law rules, unless a mandatory consumer law in your country
        says otherwise. If a court finds one clause unenforceable, the rest
        still apply.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms: use the Contact page.
      </p>
    </ProsePage>
  );
}
