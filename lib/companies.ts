import { hasSupabaseConfig, createAnonClient } from "./supabase";
import type { Company, Job } from "./types";

const SELECT_FIELDS =
  "id, slug, company_name, pitch, description, website_url, logo_url, email, location, founded_year, team_size, batch, activity_status, industries, linkedin_url, twitter_url, primary_partner, founders, jobs, hq_region, is_nonprofit, is_top_company, created_at, status, user_id";

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
    user_id: row.user_id ?? null,
  };
}

const DUMMY_COMPANIES: Company[] = [
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000001",
    slug: "neuralpen",
    company_name: "NeuralPen",
    pitch: "AI writing assistant for technical docs",
    description: "NeuralPen is an AI-powered writing assistant specifically designed to help engineers and technical writers craft clear, concise, and accurate documentation. It integrates directly into your existing workflow to provide real-time suggestions.",
    website_url: "https://example.com/neuralpen",
    logo_url: null,
    location: "San Francisco",
    team_size: "8",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["B2B", "AI"],
    is_top_company: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    founders: [{ name: "Alice Chen", title: "CEO", bio: "Former ML researcher.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000002",
    slug: "farmstack",
    company_name: "FarmStack",
    pitch: "Precision agriculture analytics platform",
    description: "FarmStack brings big data to the farm. Our platform helps modern farmers optimize their crop yields through advanced analytics, IoT sensors, and satellite imagery.",
    website_url: "https://example.com/farmstack",
    logo_url: null,
    location: "Remote",
    team_size: "15",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["Industrials", "Agriculture"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    founders: [{ name: "Bob Smith", title: "CTO", bio: "Agriculture expert.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000003",
    slug: "paybridge",
    company_name: "PayBridge",
    pitch: "Cross-border payment rails for SMBs",
    description: "PayBridge simplifies international trade by providing seamless, low-cost cross-border payment rails for small and medium-sized businesses.",
    website_url: "https://example.com/paybridge",
    logo_url: null,
    location: "London, UK",
    team_size: "12",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["Fintech", "Payments"],
    is_top_company: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    founders: [{ name: "Charlie Davis", title: "CEO", bio: "Fintech veteran.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
    jobs: [
      { title: "Senior Backend Engineer", location: "London, UK", salary: "£80k-£120k", equity: "0.1-0.5%", experience: "3+ years", apply_url: "https://example.com/paybridge/jobs/1" },
      { title: "Product Marketing Manager", location: "London, UK", salary: "£60k-£90k", equity: "0.1-0.3%", experience: "2+ years", apply_url: "https://example.com/paybridge/jobs/2" }
    ],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000004",
    slug: "medscribe",
    company_name: "MedScribe",
    pitch: "AI clinical note-taking for doctors",
    description: "MedScribe uses state-of-the-art voice AI to transcribe patient encounters and automatically generate clinical notes, saving doctors hours of administrative work each day.",
    website_url: "https://example.com/medscribe",
    logo_url: null,
    location: "Boston, MA",
    team_size: "6",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["Healthcare", "Digital Health"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    founders: [{ name: "Dr. Diana Evans", title: "Co-Founder", bio: "Physician and AI enthusiast.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
    jobs: [
      { title: "Machine Learning Engineer", location: "Boston, MA", salary: "$130k-$170k", equity: "0.5-1.0%", experience: "4+ years", apply_url: "https://example.com/medscribe/jobs/1" }
    ],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000005",
    slug: "eduspark",
    company_name: "EduSpark",
    pitch: "Personalized K-12 tutoring marketplace",
    description: "EduSpark connects K-12 students with top-tier tutors for personalized learning experiences. Our platform ensures that every student finds the right mentor to succeed.",
    website_url: "https://example.com/eduspark",
    logo_url: null,
    location: "Remote",
    team_size: "4",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["Education", "EdTech"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    founders: [{ name: "Evan Ford", title: "Founder", bio: "Former teacher.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000006",
    slug: "greenvolt",
    company_name: "GreenVolt",
    pitch: "Smart EV charging infrastructure",
    description: "GreenVolt builds smart, scalable EV charging solutions for residential and commercial properties, accelerating the transition to sustainable energy.",
    website_url: "https://example.com/greenvolt",
    logo_url: null,
    location: "Berlin, Germany",
    team_size: "22",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["Industrials", "Climate and CleanTech"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    founders: [{ name: "Fiona Green", title: "CEO", bio: "Clean energy advocate.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
    jobs: [
      { title: "Hardware Engineer", location: "Berlin, Germany", salary: "€70k-€100k", equity: "0.2-0.5%", experience: "3+ years", apply_url: "https://example.com/greenvolt/jobs/1" },
      { title: "Operations Lead", location: "Berlin, Germany", salary: "€60k-€85k", equity: "0.1-0.3%", experience: "2+ years", apply_url: "https://example.com/greenvolt/jobs/2" }
    ],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000007",
    slug: "legalbot",
    company_name: "LegalBot",
    pitch: "Contract review automation",
    description: "LegalBot automates the tedious process of contract review using AI, highlighting key risks and anomalies so legal teams can focus on strategic work.",
    website_url: "https://example.com/legalbot",
    logo_url: null,
    location: "New York, NY",
    team_size: "10",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["B2B", "Legal"],
    is_top_company: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
    founders: [{ name: "George Hall", title: "CEO", bio: "Lawyer turned builder.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000008",
    slug: "homely",
    company_name: "Homely",
    pitch: "AI-powered interior design marketplace",
    description: "Homely uses AI to instantly generate personalized interior design concepts and connects you with top designers and furniture retailers to bring your vision to life.",
    website_url: "https://example.com/homely",
    logo_url: null,
    location: "Toronto, Canada",
    team_size: "5",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["Consumer", "Home and Personal"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    founders: [{ name: "Hannah Iyer", title: "Founder & CEO", bio: "Design expert.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000009",
    slug: "securenet",
    company_name: "SecureNet",
    pitch: "Zero-trust network security for startups",
    description: "SecureNet provides a plug-and-play zero-trust network security solution tailored for fast-growing startups, ensuring robust protection without slowing down development.",
    website_url: "https://example.com/securenet",
    logo_url: null,
    location: "Singapore",
    team_size: "18",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["B2B", "Security"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17).toISOString(),
    founders: [{ name: "Ian James", title: "CTO", bio: "Cybersecurity specialist.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
    jobs: [
      { title: "Security Analyst", location: "Singapore", salary: "$90k-$130k", equity: "0.2-0.5%", experience: "2+ years", apply_url: "https://example.com/securenet/jobs/1" }
    ],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000010",
    slug: "crowdlens",
    company_name: "CrowdLens",
    pitch: "Real-time crowd analytics",
    description: "CrowdLens offers computer vision solutions for real-time crowd analytics, helping event organizers and retail spaces optimize flow and enhance safety.",
    website_url: "https://example.com/crowdlens",
    logo_url: null,
    location: "Mumbai, India",
    team_size: "7",
    batch: "Batch 1",
    activity_status: "Stealth",
    industries: ["B2B", "Analytics"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(),
    founders: [{ name: "Jaya Kumar", title: "CEO", bio: "Computer vision researcher.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000011",
    slug: "goodharvest",
    company_name: "GoodHarvest",
    pitch: "Farm-to-table supply chain",
    description: "GoodHarvest is a nonprofit initiative optimizing the farm-to-table supply chain to reduce food waste and support local farmers.",
    website_url: "https://example.com/goodharvest",
    logo_url: null,
    location: "Portland, OR",
    team_size: "3",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["Consumer", "Food and Beverage"],
    is_nonprofit: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    founders: [{ name: "Kevin Lee", title: "Director", bio: "Sustainability advocate.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
  }),
  normalizeCompany({
    id: "00000000-0000-0000-0000-000000000012",
    slug: "codecraft",
    company_name: "CodeCraft",
    pitch: "AI pair programming tool",
    description: "CodeCraft is your intelligent AI pair programmer, suggesting code snippets, refactoring opportunities, and test cases right within your IDE.",
    website_url: "https://example.com/codecraft",
    logo_url: null,
    location: "Austin, TX",
    team_size: "11",
    batch: "Batch 1",
    activity_status: "Active",
    industries: ["B2B", "Engineering, Product and Design"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 23).toISOString(),
    founders: [{ name: "Laura Miller", title: "Co-Founder", bio: "Software engineer.", twitter_url: "#", linkedin_url: "#", photo_url: null }],
  })
];

export async function getLiveCompanies(): Promise<Company[]> {
  if (!hasSupabaseConfig()) {
    return DUMMY_COMPANIES;
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
      return DUMMY_COMPANIES;
    }
    const companies = (retry.data ?? []).map((row) => normalizeCompany(row as unknown as Company));
    return companies.length > 0 ? companies : DUMMY_COMPANIES;
  }

  const companies = (data ?? []).map((row) => normalizeCompany(row as Company));
  return companies.length > 0 ? companies : DUMMY_COMPANIES;
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  if (!hasSupabaseConfig()) return DUMMY_COMPANIES.find((c) => c.slug === slug) || null;

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("companies")
    .select(SELECT_FIELDS)
    .eq("status", "live")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load company", error);
    return DUMMY_COMPANIES.find((c) => c.slug === slug) || null;
  }

  return data ? normalizeCompany(data as Company) : DUMMY_COMPANIES.find((c) => c.slug === slug) || null;
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
    "https://www.whyalligator.com"
  );
}

export function teamSizeNumber(company: Pick<Company, "team_size">): number {
  const n = parseInt(String(company.team_size), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function getBatchName(companyIndex: number): string {
  const batchNum = Math.floor(companyIndex / 3000) + 1;
  return `Batch ${batchNum}`;
}

