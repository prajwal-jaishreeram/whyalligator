import type { Metadata } from "next";
import { ProsePage } from "@/components/ProsePage";

export const metadata: Metadata = {
  title: "Privacy Policy | WhyAlligator",
};

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy Policy">
      <p>Last updated: September 13, 2026</p>
      <p>
        WhyAlligator (“we”, “us”) operates the website that lists startups for a
        one-time fee. This policy explains what we collect, why, and how you can
        ask us to change or delete it.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>
          Listing details you submit: company name, pitch, description, website,
          location, team size, batch, industry tags, founder names and bios,
          optional job posts, and uploaded logos or founder photos.
        </li>
        <li>
          The founder email address used for checkout and the confirmation
          email.
        </li>
        <li>
          Payment confirmation from Stripe (we do not store full card numbers).
        </li>
        <li>
          Basic server logs such as IP address, browser type, and pages viewed,
          used to keep the site running and to debug errors.
        </li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To publish your public company page and directory card after payment.</li>
        <li>To send a transactional email confirming that the listing is live.</li>
        <li>To prevent fraud, enforce the Terms of Use, and operate the service.</li>
      </ul>
      <h2>What is public</h2>
      <p>
        Everything on a company page except the founder email is public once the
        listing is live. Do not upload photos or text you do not want on the
        open web.
      </p>
      <h2>Processors</h2>
      <p>
        We use Supabase to store listings and files, Stripe to take the $20
        payment, Resend to send confirmation email, and Cloudflare to host the
        site. Each processor has its own privacy terms.
      </p>
      <h2>Retention and your rights</h2>
      <p>
        We keep live listings until you ask us to take them down. You may
        request access, correction, or deletion of your listing and email by
        writing to us through the Contact page. We may keep limited records
        needed for taxes, dispute handling, or legal compliance.
      </p>
      <h2>Children</h2>
      <p>
        The service is for people 18 or older. We do not knowingly collect
        information from children.
      </p>
      <h2>Changes</h2>
      <p>
        If this policy changes in a material way, we will update the date above
        and post the new version on this page.
      </p>
    </ProsePage>
  );
}
