import type { Founder, Job, ListingPayload } from "./types";
import { normalizeWebsite } from "./validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function optionalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return normalizeWebsite(trimmed);
}

export function parseIndustries(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);
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
  const is_top_company = form.get("is_top_company") === "on";

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
    return empty("Location is required.");
  }

  const founderCount = Number(form.get("founder_count") ?? 1);
  const founders: Founder[] = [];
  for (let i = 0; i < Math.min(Math.max(founderCount, 1), 4); i += 1) {
    const name = String(form.get(`founder_name_${i}`) ?? "").trim();
    const title = String(form.get(`founder_title_${i}`) ?? "").trim();
    const bio = String(form.get(`founder_bio_${i}`) ?? "").trim();
    if (!name && !title && !bio) continue;
    if (name.length < 2) {
      return empty("Each founder needs a name.");
    }
    founders.push({
      name,
      title: title || "Founder",
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
    jobs.push({
      title,
      location: String(form.get(`job_location_${i}`) ?? "").trim() || location,
      salary: String(form.get(`job_salary_${i}`) ?? "").trim(),
      equity: String(form.get(`job_equity_${i}`) ?? "").trim(),
      experience: String(form.get(`job_experience_${i}`) ?? "").trim(),
      apply_url:
        optionalUrl(String(form.get(`job_apply_url_${i}`) ?? "")) || website_url,
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
      is_top_company,
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
