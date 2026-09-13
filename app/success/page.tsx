import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  let href = "/";

  if (sessionId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("companies")
      .select("slug")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (data?.slug) href = `/companies/${data.slug}`;
  }

  return (
    <main>
      <section className="hero">
        <h1>You&apos;re in the other 99%</h1>
        <p className="hero-copy">
          Payment landed. Your company page is live. Newest first, no ranking.
          We also emailed the founder.
        </p>
        <Link href={href} className="hero-cta">
          See your page
        </Link>
      </section>
    </main>
  );
}
