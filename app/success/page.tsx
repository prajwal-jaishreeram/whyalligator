import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import Confetti from "@/components/ui/motion-confetti";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; status?: string }>;
}) {
  const { payment_id: paymentId, status } = await searchParams;

  if (status && status !== "succeeded" && status !== "processing") {
    return (
      <main>
        <section className="hero">
          <h1>Payment didn&apos;t go through</h1>
          <p className="hero-copy">
            You were not charged. In test mode, you must use designated test credentials:
            <br />
            • <strong>Indian Card (Visa):</strong> <code>4576 2389 1277 1450</code> (06/32, CVV 123)
            <br />
            • <strong>UPI:</strong> <code>success@upi</code>
            <br />
            • <strong>US Card:</strong> <code>4242 4242 4242 4242</code> (requires changing Billing Country to US)
          </p>
          <p className="hero-copy" style={{ marginTop: "-4px" }}>
            ✓ <strong>All your listing details were preserved.</strong> Click below to return to your form and retry payment.
          </p>
          <Link href="/add" className="hero-cta">
            Return to application &amp; retry
          </Link>
        </section>
      </main>
    );
  }

  let href = "/";
  let found = false;

  if (paymentId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("companies")
      .select("slug")
      .eq("payment_id", paymentId)
      .maybeSingle();
    if (data?.slug) {
      href = `/companies/${data.slug}`;
      found = true;
    }
  }

  return (
    <main>
      {/* Clear saved draft once payment succeeds */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{localStorage.removeItem("whyalligator_listing_draft_v1");}catch(e){}`,
        }}
      />
      <Confetti />
      <section className="hero">
        <h1>You&apos;re in the other 99%</h1>
        <p className="hero-copy">
          {found
            ? "Payment landed. Your company page is live. Newest first, no ranking. We also emailed the founder."
            : "Payment landed. Your page goes live in a few seconds, and we'll email the founder the link."}
        </p>
        <div style={{ marginTop: "24px" }}>
          <Link href={href} className="hero-cta">
            {found ? "See your page" : "Back to the directory"}
          </Link>
        </div>
      </section>
    </main>
  );
}
