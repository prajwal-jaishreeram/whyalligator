export type Founder = {
  name: string;
  title: string;
  bio: string;
  photo_url: string | null;
  twitter_url: string;
  linkedin_url: string;
};

export type Job = {
  title: string;
  location: string;
  salary: string;
  equity: string;
  experience: string;
  apply_url: string;
};

export type Company = {
  id: string;
  slug: string;
  company_name: string;
  pitch: string;
  description: string;
  website_url: string;
  logo_url: string | null;
  email: string;
  location: string;
  founded_year: string;
  team_size: string;
  batch: string;
  activity_status: string;
  industries: string[];
  linkedin_url: string;
  twitter_url: string;
  primary_partner: string;
  founders: Founder[];
  jobs: Job[];
  hq_region: string;
  is_nonprofit: boolean;
  is_top_company: boolean;
  created_at: string;
  status: "live";
};

export type ListingPayload = Omit<
  Company,
  "id" | "slug" | "logo_url" | "created_at" | "status"
> & {
  logo_path?: string;
};
