import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CompanyProfile } from "@/components/CompanyProfile";
import { getCompanyBySlug, getLiveCompanies } from "@/lib/companies";

export const revalidate = 60;

export async function generateStaticParams() {
  const companies = await getLiveCompanies();
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) {
    return {
      title: "Company Not Found",
      robots: { index: false, follow: false },
    };
  }
  const canonicalUrl = `https://www.whyalligator.com/companies/${company.slug}`;
  return {
    title: `${company.company_name}: ${company.pitch}`,
    description: company.description || company.pitch,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${company.company_name}: ${company.pitch}`,
      description: company.description || company.pitch,
      url: canonicalUrl,
      images: company.logo_url ? [{ url: company.logo_url }] : ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${company.company_name}: ${company.pitch}`,
      description: company.description || company.pitch,
      images: company.logo_url ? [company.logo_url] : ["/og-image.png"],
    },
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  return (
    <main className="profile-main">
      <CompanyProfile company={company} />
    </main>
  );
}
