import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/companies";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/auth/",
        "/reset-password",
        "/success",
        "/companies/*/edit",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
