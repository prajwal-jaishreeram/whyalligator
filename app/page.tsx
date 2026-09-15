import Link from "next/link";
import { DirectoryClient } from "@/components/DirectoryClient";
import { getLiveCompanies } from "@/lib/companies";

export const revalidate = 60;

export default async function HomePage() {
  const companies = await getLiveCompanies();

  return (
    <main>
      <section className="hero">
        <h1>Startup Directory</h1>
        <p className="hero-copy">
          Y Combinator accepts 1%. We accept the other 99%. Since whenever,
          we have listed companies that were not selected, not ranked, and not
          asked to fly to San Francisco. To add yours,{" "}
          <Link href="/add">pay $20</Link>.
        </p>
        <Link href="/add" className="hero-cta">
          Add your startup ($20)
        </Link>
        <div className="hero-metrics">
          <div className="hero-metrics-badge">
            <span className="hero-pulse-dot" />
            <span>
              <strong>{companies.length % 3000} / 3,000 listed</strong> in Batch {Math.floor(companies.length / 3000) + 1}
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
        <DirectoryClient companies={companies} />
      </div>
    </main>
  );
}
