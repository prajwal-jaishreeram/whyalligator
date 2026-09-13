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
      </section>
      <div className="page-width">
        <DirectoryClient companies={companies} />
      </div>
    </main>
  );
}
