import type { Metadata } from "next";
import Link from "next/link";
import { getLiveCompanies } from "@/lib/companies";

export const revalidate = 60;
export const metadata: Metadata = { title: "Library | WhyAlligator" };

export default async function LibraryPage() {
  const companies = await getLiveCompanies();

  return (
    <main>
      <section className="hero">
        <h1>Library</h1>
        <p className="hero-copy">
          Every live WhyAlligator company, newest first. This is the catalog,
          not a ranking.
        </p>
      </section>
      <div className="page-width prose-page">
        {companies.length === 0 ? (
          <p>No listings yet. The library fills up when someone pays $20.</p>
        ) : (
          <ul className="library-list">
            {companies.map((company) => (
              <li key={company.id}>
                <Link href={`/companies/${company.slug}`}>
                  {company.company_name}
                </Link>
                <span> {company.pitch}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
