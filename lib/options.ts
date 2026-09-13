export const HQ_REGIONS = [
  "Americas / Canada",
  "Europe",
  "South Asia",
  "Southeast Asia",
  "East Asia",
  "Middle East and North Africa",
  "Latin America",
  "Africa",
  "Oceania",
  "Remote",
] as const;

export type HqRegion = (typeof HQ_REGIONS)[number];
