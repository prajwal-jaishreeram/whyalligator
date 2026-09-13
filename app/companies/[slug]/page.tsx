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
  if (!company) return { title: "Company | WhyAlligator" };
  return {
    title: `${company.company_name}: ${company.pitch} | WhyAlligator`,
    description: company.description || company.pitch,
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
