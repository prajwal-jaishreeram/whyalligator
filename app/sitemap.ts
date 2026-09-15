import type { MetadataRoute } from "next";
import { getLiveCompanies, siteUrl } from "@/lib/companies";

const STATIC_PATHS = [
  "/",
  "/about",
  "/add",
  "/jobs",
  "/library",
  "/resources",
  "/partners",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const companies = await getLiveCompanies();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const companyEntries: MetadataRoute.Sitemap = companies.map((company) => ({
    url: `${origin}/companies/${company.slug}`,
    lastModified: new Date(company.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...companyEntries];
}
