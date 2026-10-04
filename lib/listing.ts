import type { Founder, Job, ListingPayload, SocialLink } from "./types";
import { normalizeWebsite } from "./validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function optionalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return normalizeWebsite(trimmed);
}

export function parseIndustries(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((p) => String(p).trim()).filter(Boolean).slice(0, 3);
    }
  } catch {}

  let processed = trimmed;
  const COMMA_CATEGORIES = [
    "Engineering, Product and Design",
    "Travel, Leisure and Tourism",
  ];
  for (const cat of COMMA_CATEGORIES) {
    processed = processed.replace(new RegExp(cat, "gi"), cat.replace(/,/g, "___COMMA___"));
  }

  return processed
    .split(",")
    .map((part) => part.replace(/___COMMA___/g, ",").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function parsePartnerEmails(raw: string, excludeEmail?: string): string[] {
  const normalizedExclude = (excludeEmail ?? "").trim().toLowerCase();
  const seen = new Set<string>();
  const emails: string[] = [];

  for (const item of raw.split(/[\s,]+/)) {
    const cleaned = item.trim().toLowerCase();
    if (!cleaned) continue;
    if (EMAIL_PATTERN.test(cleaned) && cleaned !== normalizedExclude && !seen.has(cleaned)) {
      seen.add(cleaned);
      emails.push(cleaned);
    }
  }

  return emails.slice(0, 10);
}

export function parseListingForm(form: FormData): {
  payload: ListingPayload;
  error: string | null;
} {
  const company_name = String(form.get("company_name") ?? "").trim();
  const pitch = String(form.get("pitch") ?? "").trim();
  const website_url = normalizeWebsite(String(form.get("website_url") ?? ""));
  const email = String(form.get("email") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const location = String(form.get("location") ?? "").trim();
  const founded_year = String(form.get("founded_year") ?? "").trim();
  const team_size = String(form.get("team_size") ?? "").trim();
  const batch = String(form.get("batch") ?? "").trim() || "The Other 99%";
  const activity_status =
    String(form.get("activity_status") ?? "").trim() || "Active";
  const industries = parseIndustries(String(form.get("industries") ?? ""));
  const linkedin_url = optionalUrl(String(form.get("linkedin_url") ?? ""));
  const twitter_url = optionalUrl(String(form.get("twitter_url") ?? ""));
  const primary_partner = String(form.get("primary_partner") ?? "").trim();
  const hq_region = String(form.get("hq_region") ?? "").trim() || "Remote";
  const is_nonprofit = form.get("is_nonprofit") === "on";
  const rawPartnerEmails = String(form.get("partner_emails") ?? "");
  const partner_emails = parsePartnerEmails(rawPartnerEmails, email);

  let extra_links: SocialLink[] = [];
  try {
    const rawExtra = form.get("extra_links");
    if (rawExtra && typeof rawExtra === "string") {
      const parsed = JSON.parse(rawExtra);
      if (Array.isArray(parsed)) {
        extra_links = parsed
          .filter((item) => item && typeof item.url === "string" && item.url.trim())
          .map((item) => ({
            platform: String(item.platform || "custom").trim().toLowerCase(),
            url: optionalUrl(String(item.url || "")),
            label: String(item.label || "").trim(),
          }))
          .filter((item) => /^https?:\/\/.+/i.test(item.url));
      }
    }
  } catch {}

  if (company_name.length < 2 || company_name.length > 80) {
    return empty("Company name must be between 2 and 80 characters.");
  }
  if (pitch.length < 4 || pitch.length > 140) {
    return empty("Pitch must be between 4 and 140 characters.");
  }
  if (!/^https?:\/\/.+/i.test(website_url)) {
    return empty("Website must be a valid URL.");
  }
  if (!EMAIL_PATTERN.test(email)) {
    return empty("Enter a valid founder email.");
  }
  if (description.length < 20 || description.length > 2000) {
    return empty("Company description must be between 20 and 2000 characters.");
  }
  if (location.length < 2 || location.length > 80) {
    return empty("Location is required (2-80 characters).");
  }
  if (!founded_year || !/^\d{4}$/.test(founded_year)) {
    return empty("Founded year must be a valid 4-digit year.");
  }
  if (!team_size || isNaN(Number(team_size)) || Number(team_size) < 1) {
    return empty("Team size must be a positive number.");
  }
  if (industries.length === 0) {
    return empty("Please select at least one industry.");
  }

  const founderCount = Number(form.get("founder_count") ?? 1);
  const founders: Founder[] = [];
  for (let i = 0; i < Math.min(Math.max(founderCount, 1), 4); i += 1) {
    const name = String(form.get(`founder_name_${i}`) ?? "").trim();
    const title = String(form.get(`founder_title_${i}`) ?? "").trim();
    const bio = String(form.get(`founder_bio_${i}`) ?? "").trim();
    if (!name && !title && !bio) continue;
    if (name.length < 2) {
      return empty("Each founder needs a name (at least 2 characters).");
    }
    if (!title || title.length < 2) {
      return empty(`Founder "${name}" needs a title/role (at least 2 characters).`);
    }
    if (bio.length < 10) {
      return empty(`Founder "${name}" needs a bio (at least 10 characters).`);
    }
    founders.push({
      name,
      title,
      bio,
      photo_url: null,
      twitter_url: optionalUrl(String(form.get(`founder_twitter_${i}`) ?? "")),
      linkedin_url: optionalUrl(String(form.get(`founder_linkedin_${i}`) ?? "")),
    });
  }
  if (founders.length === 0) {
    return empty("Add at least one founder.");
  }

  const jobCount = Number(form.get("job_count") ?? 0);
  const jobs: Job[] = [];
  for (let i = 0; i < Math.min(Math.max(jobCount, 0), 6); i += 1) {
    const title = String(form.get(`job_title_${i}`) ?? "").trim();
    if (!title) continue;
    const jobApplyUrl = optionalUrl(String(form.get(`job_apply_url_${i}`) ?? "")) || website_url;
    if (!/^https?:\/\/.+/i.test(jobApplyUrl)) {
      return empty(`Job "${title}" needs a valid apply URL.`);
    }
    jobs.push({
      title,
      location: String(form.get(`job_location_${i}`) ?? "").trim() || location,
      salary: String(form.get(`job_salary_${i}`) ?? "").trim(),
      equity: String(form.get(`job_equity_${i}`) ?? "").trim(),
      experience: String(form.get(`job_experience_${i}`) ?? "").trim(),
      apply_url: jobApplyUrl,
    });
  }

  return {
    error: null,
    payload: {
      company_name,
      pitch,
      website_url,
      email,
      description,
      location,
      founded_year,
      team_size,
      batch,
      activity_status,
      industries,
      linkedin_url,
      twitter_url,
      primary_partner,
      founders,
      jobs,
      hq_region,
      is_nonprofit,
      is_top_company: false,
      partner_emails,
      extra_links,
    },
  };
}

function empty(error: string): { payload: ListingPayload; error: string } {
  return {
    error,
    payload: {
      company_name: "",
      pitch: "",
      website_url: "",
      email: "",
      partner_emails: [],
      description: "",
      location: "",
      founded_year: "",
      team_size: "",
      batch: "",
      activity_status: "Active",
      industries: [],
      linkedin_url: "",
      twitter_url: "",
      primary_partner: "",
      founders: [],
      jobs: [],
      hq_region: "Remote",
      is_nonprofit: false,
      is_top_company: false,
    },
  };
}
