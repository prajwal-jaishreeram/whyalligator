export type TaxonomyItem = {
  name: string;
  subcategories?: string[];
};

export const INDUSTRY_TAXONOMY: TaxonomyItem[] = [
  {
    name: "AI",
    subcategories: [
      "Generative AI",
      "LLMs & Foundation Models",
      "AI Agents & Automation",
      "Machine Learning",
      "Computer Vision",
      "Natural Language Processing",
      "AI Infrastructure & Developer Tools",
      "Robotics & Autonomous Systems",
    ],
  },
  {
    name: "SaaS",
    subcategories: [
      "B2B SaaS",
      "Enterprise SaaS",
      "Vertical SaaS",
      "Micro-SaaS",
      "Productivity & Workflow",
      "Customer Support & Success",
      "Sales & Marketing Automation",
      "HR & Operations SaaS",
    ],
  },
  {
    name: "B2B",
    subcategories: [
      "Analytics",
      "Engineering, Product and Design",
      "Finance and Accounting",
      "Human Resources",
      "Infrastructure",
      "Legal",
      "Marketing",
      "Office Management",
      "Operations",
      "Productivity",
      "Recruiting and Talent",
      "Retail",
      "Sales",
      "Security",
      "Supply Chain and Logistics",
    ],
  },
  {
    name: "B2C",
    subcategories: [
      "Consumer Apps & Mobile",
      "E-Commerce & D2C",
      "Social & Community",
      "Gaming & Entertainment",
      "Content & Media",
      "Consumer Hardware",
      "Food & Beverage",
      "Health & Wellness",
      "Travel & Hospitality",
    ],
  },
  {
    name: "Consumer",
    subcategories: [
      "Apparel and Cosmetics",
      "Consumer Electronics",
      "Content",
      "Food and Beverage",
      "Gaming",
      "Home and Personal",
      "Social",
      "Transportation",
      "Travel, Leisure and Tourism",
    ],
  },
  {
    name: "Fintech",
    subcategories: [
      "Banking and Exchange",
      "Credit and Lending",
      "Crowdfunding",
      "Crypto / Web3",
      "Insurance",
      "Payments",
      "Real Estate and Mortgages",
    ],
  },
  {
    name: "Healthcare",
    subcategories: [
      "Consumer Health",
      "Diagnostics",
      "Digital Health",
      "Drug Discovery and Delivery",
      "Healthcare IT",
      "Medical Devices",
      "Therapeutics",
    ],
  },
  {
    name: "Industrials",
    subcategories: [
      "Aerospace and Defense",
      "Agriculture",
      "Automotive",
      "Climate and CleanTech",
      "Energy",
      "Manufacturing",
      "Robotics",
    ],
  },
  {
    name: "Education",
    subcategories: [
      "EdTech",
      "Higher Education",
      "Language Learning",
      "Online Learning",
      "Upskilling",
    ],
  },
  {
    name: "Real Estate and Construction",
    subcategories: [
      "Architecture and Engineering",
      "Commercial Real Estate",
      "Construction",
      "Housing and Real Estate",
      "Property Management",
    ],
  },
  {
    name: "Government",
    subcategories: [
      "Civic Tech",
      "Defense Tech",
      "GovTech",
      "Public Safety",
    ],
  },
];

export const REGION_TAXONOMY: TaxonomyItem[] = [
  {
    name: "America / Canada",
    subcategories: [
      "United States of America",
      "Canada",
      "Bermuda",
    ],
  },
  {
    name: "Remote",
    subcategories: [
      "Fully Remote",
      "Partly Remote",
    ],
  },
  {
    name: "Europe",
    subcategories: [
      "United Kingdom",
      "France",
      "Germany",
      "Sweden",
      "Spain",
      "Denmark",
      "Netherlands",
      "Switzerland",
      "Norway",
      "Ireland",
      "Poland",
      "Portugal",
      "Slovenia",
      "Austria",
      "Belgium",
      "Finland",
      "Italy",
    ],
  },
  {
    name: "South Asia",
    subcategories: [
      "India",
      "Pakistan",
      "Bangladesh",
    ],
  },
  {
    name: "Southeast Asia",
    subcategories: [
      "Singapore",
      "Indonesia",
      "Vietnam",
      "Philippines",
      "Malaysia",
      "Thailand",
    ],
  },
  {
    name: "East Asia",
    subcategories: [
      "Japan",
      "South Korea",
      "Taiwan",
      "Hong Kong",
    ],
  },
  {
    name: "Latin America",
    subcategories: [
      "Brazil",
      "Mexico",
      "Colombia",
      "Argentina",
      "Chile",
    ],
  },
  {
    name: "Middle East and North Africa",
    subcategories: [
      "United Arab Emirates",
      "Saudi Arabia",
      "Egypt",
      "Israel",
    ],
  },
  {
    name: "Africa",
    subcategories: [
      "Nigeria",
      "Kenya",
      "South Africa",
      "Ghana",
      "Egypt",
    ],
  },
  {
    name: "Oceania",
    subcategories: [
      "Australia",
      "New Zealand",
    ],
  },
];

export const HQ_REGIONS = REGION_TAXONOMY.map((r) => r.name);
export type HqRegion = (typeof HQ_REGIONS)[number];

export const COUNTRY_TO_REGION: Record<string, string> = {
  // America / Canada
  "United States of America": "America / Canada",
  "United States": "America / Canada",
  "Canada": "America / Canada",
  "Bermuda": "America / Canada",

  // Europe
  "United Kingdom": "Europe",
  "France": "Europe",
  "Germany": "Europe",
  "Sweden": "Europe",
  "Spain": "Europe",
  "Denmark": "Europe",
  "Netherlands": "Europe",
  "Switzerland": "Europe",
  "Norway": "Europe",
  "Ireland": "Europe",
  "Poland": "Europe",
  "Portugal": "Europe",
  "Slovenia": "Europe",
  "Austria": "Europe",
  "Belgium": "Europe",
  "Finland": "Europe",
  "Italy": "Europe",
  "Czech Republic": "Europe",
  "Estonia": "Europe",
  "Greece": "Europe",
  "Hungary": "Europe",
  "Iceland": "Europe",
  "Latvia": "Europe",
  "Lithuania": "Europe",
  "Luxembourg": "Europe",
  "Romania": "Europe",
  "Slovakia": "Europe",
  "Ukraine": "Europe",
  "Bulgaria": "Europe",
  "Croatia": "Europe",
  "Cyprus": "Europe",
  "Malta": "Europe",

  // South Asia
  "India": "South Asia",
  "Pakistan": "South Asia",
  "Bangladesh": "South Asia",
  "Nepal": "South Asia",
  "Sri Lanka": "South Asia",
  "Bhutan": "South Asia",
  "Maldives": "South Asia",

  // Southeast Asia
  "Singapore": "Southeast Asia",
  "Indonesia": "Southeast Asia",
  "Vietnam": "Southeast Asia",
  "Philippines": "Southeast Asia",
  "Malaysia": "Southeast Asia",
  "Thailand": "Southeast Asia",
  "Cambodia": "Southeast Asia",
  "Myanmar": "Southeast Asia",

  // East Asia
  "Japan": "East Asia",
  "South Korea": "East Asia",
  "Taiwan": "East Asia",
  "Hong Kong": "East Asia",
  "China": "East Asia",
  "Mongolia": "East Asia",

  // Latin America
  "Brazil": "Latin America",
  "Mexico": "Latin America",
  "Colombia": "Latin America",
  "Argentina": "Latin America",
  "Chile": "Latin America",
  "Peru": "Latin America",
  "Uruguay": "Latin America",
  "Ecuador": "Latin America",
  "Costa Rica": "Latin America",
  "Panama": "Latin America",
  "Dominican Republic": "Latin America",
  "Guatemala": "Latin America",
  "Bolivia": "Latin America",
  "Paraguay": "Latin America",
  "Venezuela": "Latin America",

  // Middle East and North Africa
  "United Arab Emirates": "Middle East and North Africa",
  "Saudi Arabia": "Middle East and North Africa",
  "Egypt": "Middle East and North Africa",
  "Israel": "Middle East and North Africa",
  "Qatar": "Middle East and North Africa",
  "Kuwait": "Middle East and North Africa",
  "Bahrain": "Middle East and North Africa",
  "Oman": "Middle East and North Africa",
  "Jordan": "Middle East and North Africa",
  "Lebanon": "Middle East and North Africa",
  "Morocco": "Middle East and North Africa",
  "Tunisia": "Middle East and North Africa",
  "Algeria": "Middle East and North Africa",

  // Africa
  "Nigeria": "Africa",
  "Kenya": "Africa",
  "South Africa": "Africa",
  "Ghana": "Africa",
  "Rwanda": "Africa",
  "Uganda": "Africa",
  "Tanzania": "Africa",
  "Ethiopia": "Africa",
  "Senegal": "Africa",
  "Ivory Coast": "Africa",
  "Cameroon": "Africa",
  "Zimbabwe": "Africa",
  "Zambia": "Africa",
  "Mauritius": "Africa",

  // Oceania
  "Australia": "Oceania",
  "New Zealand": "Oceania",
  "Fiji": "Oceania",

  // Remote
  "Remote": "Remote",
  "Fully Remote": "Remote",
  "Partly Remote": "Remote",
};

// Ensure every subcategory defined in REGION_TAXONOMY is present in COUNTRY_TO_REGION
for (const reg of REGION_TAXONOMY) {
  for (const sub of reg.subcategories ?? []) {
    if (!COUNTRY_TO_REGION[sub]) {
      COUNTRY_TO_REGION[sub] = reg.name;
    }
  }
}

export const COUNTRY_FLAGS: Record<string, string> = {
  // America / Canada
  "United States of America": "🇺🇸",
  "United States": "🇺🇸",
  "Canada": "🇨🇦",
  "Bermuda": "🇧🇲",

  // Europe
  "United Kingdom": "🇬🇧",
  "France": "🇫🇷",
  "Germany": "🇩🇪",
  "Sweden": "🇸🇪",
  "Spain": "🇪🇸",
  "Denmark": "🇩🇰",
  "Netherlands": "🇳🇱",
  "Switzerland": "🇨🇭",
  "Norway": "🇳🇴",
  "Ireland": "🇮🇪",
  "Poland": "🇵🇱",
  "Portugal": "🇵🇹",
  "Slovenia": "🇸🇮",
  "Austria": "🇦🇹",
  "Belgium": "🇧🇪",
  "Finland": "🇫🇮",
  "Italy": "🇮🇹",
  "Czech Republic": "🇨🇿",
  "Estonia": "🇪🇪",
  "Greece": "🇬🇷",
  "Hungary": "🇭🇺",
  "Iceland": "🇮🇸",
  "Latvia": "🇱🇻",
  "Lithuania": "🇱🇹",
  "Luxembourg": "🇱🇺",
  "Romania": "🇷🇴",
  "Slovakia": "🇸🇰",
  "Ukraine": "🇺🇦",
  "Bulgaria": "🇧🇬",
  "Croatia": "🇭🇷",
  "Cyprus": "🇨🇾",
  "Malta": "🇲🇹",

  // South Asia
  "India": "🇮🇳",
  "Pakistan": "🇵🇰",
  "Bangladesh": "🇧🇩",
  "Nepal": "🇳🇵",
  "Sri Lanka": "🇱🇰",
  "Bhutan": "🇧🇹",
  "Maldives": "🇲🇻",

  // Southeast Asia
  "Singapore": "🇸🇬",
  "Indonesia": "🇮🇩",
  "Vietnam": "🇻🇳",
  "Philippines": "🇵🇭",
  "Malaysia": "🇲🇾",
  "Thailand": "🇹🇭",
  "Cambodia": "🇰🇭",
  "Myanmar": "🇲🇲",

  // East Asia
  "Japan": "🇯🇵",
  "South Korea": "🇰🇷",
  "Taiwan": "🇹🇼",
  "Hong Kong": "🇭🇰",
  "China": "🇨🇳",
  "Mongolia": "🇲🇳",

  // Latin America
  "Brazil": "🇧🇷",
  "Mexico": "🇲🇽",
  "Colombia": "🇨🇴",
  "Argentina": "🇦🇷",
  "Chile": "🇨🇱",
  "Peru": "🇵🇪",
  "Uruguay": "🇺🇾",
  "Ecuador": "🇪🇨",
  "Costa Rica": "🇨🇷",
  "Panama": "🇵🇦",
  "Dominican Republic": "🇩🇴",
  "Guatemala": "🇬🇹",
  "Bolivia": "🇧🇴",
  "Paraguay": "🇵🇾",
  "Venezuela": "🇻🇪",

  // Middle East and North Africa
  "United Arab Emirates": "🇦🇪",
  "Saudi Arabia": "🇸🇦",
  "Egypt": "🇪🇬",
  "Israel": "🇮🇱",
  "Qatar": "🇶🇦",
  "Kuwait": "🇰🇼",
  "Bahrain": "🇧🇭",
  "Oman": "🇴🇲",
  "Jordan": "🇯🇴",
  "Lebanon": "🇱🇧",
  "Morocco": "🇲🇦",
  "Tunisia": "🇹🇳",
  "Algeria": "🇩🇿",

  // Africa
  "Nigeria": "🇳🇬",
  "Kenya": "🇰🇪",
  "South Africa": "🇿🇦",
  "Ghana": "🇬🇭",
  "Rwanda": "🇷🇼",
  "Uganda": "🇺🇬",
  "Tanzania": "🇹🇿",
  "Ethiopia": "🇪🇹",
  "Senegal": "🇸🇳",
  "Ivory Coast": "🇨🇮",
  "Cameroon": "🇨🇲",
  "Zimbabwe": "🇿🇼",
  "Zambia": "🇿🇲",
  "Mauritius": "🇲🇺",

  // Oceania
  "Australia": "🇦🇺",
  "New Zealand": "🇳🇿",
  "Fiji": "🇫🇯",

  // Remote
  "Remote": "🌐",
  "Fully Remote": "🌐",
  "Partly Remote": "🌐",
};

export function getCountryFlag(country: string): string {
  if (!country) return "📍";
  if (COUNTRY_FLAGS[country]) return COUNTRY_FLAGS[country];
  const lower = country.toLowerCase().trim();
  if (lower === "remote" || lower.includes("remote")) return "🌐";
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (key.toLowerCase() === lower) return flag;
  }
  return "📍";
}

export const COUNTRY_LIST: string[] = Array.from(
  new Set(
    Object.keys(COUNTRY_TO_REGION).filter(
      (c) => !["Remote", "Fully Remote", "Partly Remote"].includes(c)
    )
  )
).sort((a, b) => a.localeCompare(b));

export function getRegionForCountry(country: string): string {
  const clean = (country || "").trim();
  if (!clean) return "Remote";
  if (COUNTRY_TO_REGION[clean]) return COUNTRY_TO_REGION[clean];
  const lower = clean.toLowerCase();
  for (const [key, region] of Object.entries(COUNTRY_TO_REGION)) {
    if (key.toLowerCase() === lower) return region;
  }
  return "Remote";
}

export function formatLocation(address: string, country: string): string {
  const addr = (address || "").trim();
  const ctry = (country || "").trim();
  if (!addr && !ctry) return "";
  if (!addr) return ctry;
  if (!ctry) return addr;
  if (ctry.toLowerCase() === "remote") {
    return addr ? `${addr} (Remote)` : "Remote";
  }
  if (addr.toLowerCase().endsWith(ctry.toLowerCase())) {
    return addr;
  }
  return `${addr}, ${ctry}`;
}

export function parseLocation(rawLocation: string): { country: string; address: string } {
  const loc = (rawLocation || "").trim();
  if (!loc) return { country: "", address: "" };
  if (loc.toLowerCase() === "remote" || loc.toLowerCase() === "(remote)") {
    return { country: "Remote", address: "" };
  }

  // Check aliases like USA, UK
  if (/(?:,\s*|\s+)(?:usa|u\.s\.a|u\.s\.|united states)$/i.test(loc) || /^(?:usa|united states)$/i.test(loc)) {
    const addr = loc.replace(/(?:,\s*|\s+)(?:usa|u\.s\.a|u\.s\.|united states)$/i, "").trim();
    return { country: "United States of America", address: addr === loc ? "" : addr };
  }
  if (/(?:,\s*|\s+)(?:uk|u\.k\.|great britain)$/i.test(loc) || /^(?:uk|great britain)$/i.test(loc)) {
    const addr = loc.replace(/(?:,\s*|\s+)(?:uk|u\.k\.|great britain)$/i, "").trim();
    return { country: "United Kingdom", address: addr === loc ? "" : addr };
  }

  // Check if it ends with or exactly matches one of the known countries
  for (const c of COUNTRY_LIST) {
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:,\\s*|\\s+)${escaped}$`, "i");
    if (regex.test(loc)) {
      const addr = loc.replace(regex, "").trim();
      return { country: c, address: addr };
    }
    if (loc.toLowerCase() === c.toLowerCase()) {
      return { country: c, address: "" };
    }
  }

  return { country: "", address: loc };
}
