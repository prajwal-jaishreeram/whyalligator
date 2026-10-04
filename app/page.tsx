import Link from "next/link";
import { BatchCountdownBanner } from "@/components/BatchCountdownBanner";
import { DirectoryClient } from "@/components/DirectoryClient";
import { getLiveCompanies } from "@/lib/companies";

export const revalidate = 60;

export const metadata = {
  title: "Startup Directory | Discover & Launch Real Startups | WhyAlligator",
  description:
    "YC takes 1%. We back the other 99%. List for $20 once to get discovered by customers & investors. When Batch 1 fills (3,000 startups), #1 wins a $30,000 equity-free grant.",
};

export default async function HomePage() {
  const companies = await getLiveCompanies();

  return (
    <main>
      <section className="hero">
        <h1>Startup Directory</h1>
        <p className="hero-copy">
          Y Combinator takes 1%. We back the other 99%.<br />
          $20 one-time listing. Get discovered by customers &amp; investors. Once 3,000 Batch 1 spots fill, the #1 top-voted startup wins <strong>$30,000 equity-free</strong>.
        </p>
        <Link href="/add" className="hero-cta">
          Add your startup
        </Link>
        <div className="hero-metrics">
          <div className="hero-metrics-badge">
            <span className="hero-pulse-dot" />
            <span className="hero-metrics-text">
              <strong className="hero-metrics-count">{(companies.length % 3000).toLocaleString()} / 3,000 listed</strong>
              <span className="hero-metrics-divider">•</span>
              <span className="hero-metrics-batch">Batch {Math.floor(companies.length / 3000) + 1}</span>
            </span>
          </div>
          <div
            className="hero-progress-track"
            title={`${companies.length % 3000} of 3,000 spots filled`}
          >
            <div
              className="hero-progress-fill"
              style={{ width: `${Math.max(2, ((companies.length % 3000) / 3000) * 100)}%` }}
            />
          </div>
        </div>
      </section>
      <div className="page-width">
        <BatchCountdownBanner initialTotalListings={companies.length} />
        <DirectoryClient companies={companies} />
      </div>
    </main>
  );
}
