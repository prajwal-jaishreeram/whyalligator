import type { Company } from "./types";
import { INDUSTRY_TAXONOMY, REGION_TAXONOMY, COUNTRY_TO_REGION } from "./options";

/**
 * Pure directory-filter logic. Kept free of React/Supabase so it can be
 * reused and tested in isolation.
 */

export type DirectoryFilters = {
  query: string;
  hiringOnly: boolean;
  nonprofitOnly: boolean;
  topOnly: boolean;
  batches: string[];
  industries: string[];
  regions: string[];
  minSize: number;
  /** Values >= maxTeam mean "no upper bound". */
  maxSize: number;
  maxTeam: number;
  topIds?: Set<string>;
};

export type FacetKey =
  | "query"
  | "hiring"
  | "nonprofit"
  | "top"
  | "batch"
  | "industry"
  | "region"
  | "size";

const norm = (value: string) => value.trim().toLowerCase();

export function teamSize(company: Pick<Company, "team_size">): number {
  const n = parseInt(String(company.team_size), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// ---------------------------------------------------------------- industries

const INDUSTRY_PARENT = new Map<string, string>();
const INDUSTRY_ALIASES = new Map<string, string>(); // alias (norm) -> canonical subcategory (norm)

for (const parent of INDUSTRY_TAXONOMY) {
  const pNorm = norm(parent.name);
  for (const sub of parent.subcategories ?? []) {
    const sNorm = norm(sub);
    INDUSTRY_PARENT.set(sNorm, pNorm);

    // If subcategory has commas (e.g. "Engineering, Product and Design"), map individual parts
    if (sub.includes(",")) {
      const parts = sub.split(",").map(norm).filter(Boolean);
      for (const p of parts) {
        INDUSTRY_ALIASES.set(p, sNorm);
      }
    }
    // If subcategory has slashes (e.g. "Crypto / Web3"), map individual parts
    if (sub.includes("/")) {
      const parts = sub.split("/").map(norm).filter(Boolean);
      for (const p of parts) {
        INDUSTRY_ALIASES.set(p, sNorm);
      }
    }
  }
}

// Common variations and synonyms
INDUSTRY_ALIASES.set("engineering", "engineering, product and design");
INDUSTRY_ALIASES.set("product and design", "engineering, product and design");
INDUSTRY_ALIASES.set("product & design", "engineering, product and design");
INDUSTRY_ALIASES.set("product design", "engineering, product and design");
INDUSTRY_ALIASES.set("travel", "travel, leisure and tourism");
INDUSTRY_ALIASES.set("tourism", "travel, leisure and tourism");
INDUSTRY_ALIASES.set("leisure", "travel, leisure and tourism");
INDUSTRY_ALIASES.set("leisure and tourism", "travel, leisure and tourism");
INDUSTRY_ALIASES.set("crypto", "crypto / web3");
INDUSTRY_ALIASES.set("web3", "crypto / web3");
INDUSTRY_ALIASES.set("finance", "finance and accounting");
INDUSTRY_ALIASES.set("accounting", "finance and accounting");
INDUSTRY_ALIASES.set("supply chain", "supply chain and logistics");
INDUSTRY_ALIASES.set("logistics", "supply chain and logistics");
INDUSTRY_ALIASES.set("climate", "climate and cleantech");
INDUSTRY_ALIASES.set("cleantech", "climate and cleantech");
INDUSTRY_ALIASES.set("food", "food and beverage");
INDUSTRY_ALIASES.set("beverage", "food and beverage");
INDUSTRY_ALIASES.set("home", "home and personal");
INDUSTRY_ALIASES.set("personal", "home and personal");
INDUSTRY_ALIASES.set("apparel", "apparel and cosmetics");
INDUSTRY_ALIASES.set("cosmetics", "apparel and cosmetics");
INDUSTRY_ALIASES.set("architecture", "architecture and engineering");
INDUSTRY_ALIASES.set("artificial intelligence", "ai");
INDUSTRY_ALIASES.set("gen ai", "generative ai");
INDUSTRY_ALIASES.set("genai", "generative ai");
INDUSTRY_ALIASES.set("llm", "llms & foundation models");
INDUSTRY_ALIASES.set("llms", "llms & foundation models");
INDUSTRY_ALIASES.set("software as a service", "saas");
INDUSTRY_ALIASES.set("sass", "saas");

/** Lower-cased tags plus the parent category of every subcategory tag. */
export function companyIndustrySet(company: Pick<Company, "industries">): Set<string> {
  const set = new Set<string>();
  const tags = company.industries ?? [];
  for (const tag of tags) {
    const t = norm(tag);
    if (!t) continue;
    set.add(t);

    const parent = INDUSTRY_PARENT.get(t);
    if (parent) set.add(parent);

    const canonical = INDUSTRY_ALIASES.get(t);
    if (canonical) {
      set.add(canonical);
      const canParent = INDUSTRY_PARENT.get(canonical);
      if (canParent) set.add(canParent);
    }
  }

  // Also check if combined tags include any subcategory (e.g. ["Engineering", "Product and Design"])
  const joinedTags = tags.map(norm).join(", ");
  for (const [sub, parent] of INDUSTRY_PARENT.entries()) {
    if (joinedTags.includes(sub)) {
      set.add(sub);
      set.add(parent);
    }
  }

  return set;
}

// ------------------------------------------------------------------- regions

// Extra spellings / major cities so free-text locations like "Bengaluru" or
// "London, UK" land in the right country. Country names themselves are
// always included automatically.
const COUNTRY_ALIASES: Record<string, string[]> = {
  "United States of America": [
    "united states", "usa", "u.s.a", "u.s.", "us",
    "san francisco", "sf", "bay area", "silicon valley", "palo alto",
    "mountain view", "menlo park", "san jose", "los angeles", "new york",
    "nyc", "brooklyn", "boston", "seattle", "austin", "chicago", "miami",
    "denver", "atlanta", "washington dc", "portland", "san diego",
  ],
  Canada: ["toronto", "vancouver", "montreal", "ottawa", "calgary", "waterloo"],
  "United Kingdom": [
    "uk", "u.k.", "england", "scotland", "wales", "great britain", "britain",
    "london", "manchester", "edinburgh", "cambridge, uk", "oxford",
  ],
  France: ["paris", "lyon"],
  Germany: ["berlin", "munich", "hamburg", "frankfurt", "deutschland"],
  Sweden: ["stockholm"],
  Spain: ["madrid", "barcelona"],
  Denmark: ["copenhagen"],
  Netherlands: ["amsterdam", "rotterdam", "holland", "the netherlands"],
  Switzerland: ["zurich", "zürich", "geneva", "lausanne"],
  Norway: ["oslo"],
  Ireland: ["dublin"],
  Poland: ["warsaw", "krakow"],
  Portugal: ["lisbon", "porto"],
  Austria: ["vienna"],
  Belgium: ["brussels"],
  Finland: ["helsinki"],
  Italy: ["milan", "rome"],
  India: [
    "bharat", "bangalore", "bengaluru", "mumbai", "delhi", "new delhi",
    "hyderabad", "pune", "chennai", "gurgaon", "gurugram", "noida",
    "kolkata", "ahmedabad", "jaipur", "kochi",
  ],
  Pakistan: ["karachi", "lahore", "islamabad"],
  Bangladesh: ["dhaka"],
  Indonesia: ["jakarta", "bali"],
  Vietnam: ["viet nam", "hanoi", "ho chi minh", "saigon"],
  Philippines: ["manila"],
  Malaysia: ["kuala lumpur"],
  Thailand: ["bangkok"],
  Japan: ["tokyo", "osaka"],
  "South Korea": ["korea", "seoul"],
  Taiwan: ["taipei"],
  "Hong Kong": ["hk"],
  Brazil: ["brasil", "sao paulo", "são paulo", "rio de janeiro"],
  Mexico: ["mexico city", "cdmx", "guadalajara"],
  Colombia: ["bogota", "bogotá", "medellin", "medellín"],
  Argentina: ["buenos aires"],
  Chile: ["santiago"],
  "United Arab Emirates": ["uae", "u.a.e", "dubai", "abu dhabi"],
  "Saudi Arabia": ["ksa", "riyadh", "jeddah"],
  Egypt: ["cairo"],
  Israel: ["tel aviv", "jerusalem"],
  Nigeria: ["lagos", "abuja"],
  Kenya: ["nairobi"],
  "South Africa": ["cape town", "johannesburg"],
  Ghana: ["accra"],
  Australia: ["sydney", "melbourne", "brisbane", "perth"],
  "New Zealand": ["auckland", "wellington", "nz"],
};

// US state codes for "City, ST" style locations. "IN" is skipped because it
// is far more often used for India than Indiana.
const US_STATE_CODES = new Set(
  (
    "AL AK AZ AR CA CO CT DE FL GA HI ID IL IA KS KY LA ME MD MA MI MN MS MO " +
    "MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC"
  ).split(" "),
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type CountryMatcher = { name: string; parents: string[]; pattern: RegExp };

const COUNTRY_MATCHERS: CountryMatcher[] = (() => {
  const parentsByCountry = new Map<string, string[]>();
  for (const parent of REGION_TAXONOMY) {
    if (norm(parent.name) === "remote") continue;
    for (const sub of parent.subcategories ?? []) {
      const list = parentsByCountry.get(sub) ?? [];
      list.push(parent.name);
      parentsByCountry.set(sub, list);
    }
  }
  for (const [country, region] of Object.entries(COUNTRY_TO_REGION)) {
    if (norm(region) === "remote") continue;
    const list = parentsByCountry.get(country) ?? [];
    if (!list.includes(region)) {
      list.push(region);
      parentsByCountry.set(country, list);
    }
  }
  return [...parentsByCountry.entries()].map(([name, parents]) => {
    const aliases = [name, ...(COUNTRY_ALIASES[name] ?? [])].map(norm);
    const body = aliases.map(escapeRegExp).join("|");
    return {
      name,
      parents,
      pattern: new RegExp(`(^|[^\\p{L}])(${body})(?=$|[^\\p{L}])`, "iu"),
    };
  });
})();

const REGION_PARENT_NAMES = new Set(REGION_TAXONOMY.map((r) => norm(r.name)));

/**
 * Every region/country (lower-cased) a company belongs to, derived from its
 * HQ region and its free-text location.
 */
export function companyRegionSet(
  company: Pick<Company, "hq_region" | "location">,
): Set<string> {
  const set = new Set<string>();
  const location = company.location ?? "";
  const hq = norm(company.hq_region ?? "");

  let foundCountry = false;
  for (const matcher of COUNTRY_MATCHERS) {
    if (matcher.pattern.test(location)) {
      foundCountry = true;
      set.add(norm(matcher.name));
      for (const p of matcher.parents) set.add(norm(p));
    }
  }

  // "City, ST" → United States.
  const stateMatch = location.match(/,\s*([A-Za-z]{2})\s*$/);
  if (stateMatch && US_STATE_CODES.has(stateMatch[1].toUpperCase())) {
    foundCountry = true;
    set.add(norm("United States of America"));
    set.add(norm("America / Canada"));
  }

  const locLower = location.toLowerCase();
  const mentionsRemote = /\bremote\b/.test(locLower);
  const partlyRemote = /\b(hybrid|partly remote|partially remote)\b/.test(locLower);

  if (partlyRemote) {
    set.add("remote");
    set.add("partly remote");
  } else if (mentionsRemote) {
    set.add("remote");
    set.add("fully remote");
  }

  if (REGION_PARENT_NAMES.has(hq)) {
    // "Remote" is the form default, so only trust it when the location does
    // not already point at a specific country.
    if (hq !== "remote" || !foundCountry) {
      set.add(hq);
      if (hq === "remote" && !partlyRemote) set.add("fully remote");
    }
  }

  return set;
}

// -------------------------------------------------------------------- search

function searchHaystack(company: Company): string {
  return [
    company.company_name,
    company.pitch,
    company.description,
    company.website_url,
    company.location,
    company.hq_region,
    company.batch,
    ...(company.industries ?? []),
    ...(company.founders ?? []).map((f) => `${f.name} ${f.title}`),
    ...(company.jobs ?? []).map((j) => j.title),
  ]
    .join(" ")
    .toLowerCase();
}

const haystackCache = new WeakMap<Company, string>();

function matchesQuery(company: Company, query: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  let hay = haystackCache.get(company);
  if (hay === undefined) {
    hay = searchHaystack(company);
    haystackCache.set(company, hay);
  }
  return tokens.every((t) => hay!.includes(t));
}

// ------------------------------------------------------------------- matcher

/**
 * True when the company passes every active filter. Pass `except` to ignore
 * one facet — used to compute live counts for that facet's options.
 */
export function matchesFilters(
  company: Company,
  f: DirectoryFilters,
  except?: FacetKey,
): boolean {
  if (except !== "hiring" && f.hiringOnly && (company.jobs?.length ?? 0) === 0) return false;
  if (except !== "nonprofit" && f.nonprofitOnly && !company.is_nonprofit) return false;
  if (except !== "top" && f.topOnly) {
    if (f.topIds && !f.topIds.has(company.id)) return false;
  }

  if (except !== "batch" && f.batches.length > 0 && !f.batches.includes(company.batch)) {
    return false;
  }

  if (except !== "industry" && f.industries.length > 0) {
    const set = companyIndustrySet(company);
    if (!f.industries.some((i) => set.has(norm(i)))) return false;
  }

  if (except !== "region" && f.regions.length > 0) {
    const set = companyRegionSet(company);
    if (!f.regions.some((r) => set.has(norm(r)))) return false;
  }

  if (except !== "size") {
    const size = teamSize(company);
    if (size < f.minSize) return false;
    if (f.maxSize < f.maxTeam && size > f.maxSize) return false;
  }

  if (except !== "query" && !matchesQuery(company, f.query)) return false;

  return true;
}
