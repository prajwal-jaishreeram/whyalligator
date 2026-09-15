export type TaxonomyItem = {
  name: string;
  subcategories?: string[];
};

export const INDUSTRY_TAXONOMY: TaxonomyItem[] = [
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
