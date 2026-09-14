import { hasSupabaseConfig, createAnonClient } from "./supabase";
import type { Company, Job } from "./types";

const SELECT_FIELDS =
  "id, slug, company_name, pitch, description, website_url, logo_url, email, location, founded_year, team_size, batch, activity_status, industries, linkedin_url, twitter_url, primary_partner, founders, jobs, hq_region, is_nonprofit, is_top_company, created_at, status";

function normalizeCompany(
  row: Partial<Company> & { id: string; company_name: string },
): Company {
  return {
    id: row.id,
    slug: row.slug || row.id,
    company_name: row.company_name,
    pitch: row.pitch || "",
    description: row.description || row.pitch || "",
    website_url: row.website_url || "",
    logo_url: row.logo_url ?? null,
    email: row.email || "",
    location: row.location || "",
    founded_year: row.founded_year || "",
    team_size: row.team_size || "",
    batch: row.batch || "The Other 99%",
    activity_status: row.activity_status || "Active",
    industries: row.industries ?? [],
    linkedin_url: row.linkedin_url || "",
    twitter_url: row.twitter_url || "",
    primary_partner: row.primary_partner || "",
    founders: row.founders ?? [],
    jobs: row.jobs ?? [],
    hq_region: row.hq_region || "Remote",
    is_nonprofit: Boolean(row.is_nonprofit),
    is_top_company: Boolean(row.is_top_company),
    created_at: row.created_at || new Date().toISOString(),
    status: "live",
  };
}

export async function getLiveCompanies(): Promise<Company[]> {
  if (!hasSupabaseConfig()) {
    return [];
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("companies")
    .select(SELECT_FIELDS)
    .eq("status", "live")
    .order("created_at", { ascending: false });

  if (error) {
    const retry = await supabase
      .from("companies")
      .select(SELECT_FIELDS.replace(", is_top_company", ""))
      .eq("status", "live")
      .order("created_at", { ascending: false });
    if (retry.error) {
      console.error("Failed to load companies", retry.error);
      return [];
    }
    return (retry.data ?? []).map((row) => normalizeCompany(row as Company));
  }

  return (data ?? []).map((row) => normalizeCompany(row as Company));
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  if (!hasSupabaseConfig()) return null;

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("companies")
    .select(SELECT_FIELDS)
    .eq("status", "live")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load company", error);
    return null;
  }

  return data ? normalizeCompany(data as Company) : null;
}

export type ListedJob = Job & {
  company_name: string;
  company_slug: string;
  company_logo: string | null;
};

export async function getAllJobs(): Promise<ListedJob[]> {
  const companies = await getLiveCompanies();
  return companies.flatMap((company) =>
    (company.jobs ?? []).map((job) => ({
      ...job,
      company_name: company.company_name,
      company_slug: company.slug,
      company_logo: company.logo_url,
    })),
  );
}

export function companyPath(company: Pick<Company, "slug" | "id">): string {
  return `/companies/${company.slug || company.id}`;
}

export function companyAnchor(id: string): string {
  return `company-${id}`;
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function teamSizeNumber(company: Pick<Company, "team_size">): number {
  const n = parseInt(String(company.team_size), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
