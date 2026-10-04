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

export type SocialLink = {
  platform: string; // "github" | "facebook" | "instagram" | "youtube" | "crunchbase" | "discord" | "custom"
  url: string;
  label?: string;
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
  partner_emails?: string[];
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
  upvotes_count?: number;
  extra_links?: SocialLink[];
  is_batch_winner?: boolean;
  winner_badge?: string | null;
  created_at: string;
  status: "live";
  user_id?: string | null;
};

export type BatchMilestone = {
  batch_name: string;
  target_count: number;
  funding_amount: number;
  status: "open" | "countdown" | "completed";
  countdown_started_at: string | null;
  countdown_ends_at: string | null;
  winner_company_id: string | null;
  winner_finalized_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Comment = {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  user_username?: string | null;
  user_email: string;
  user_avatar?: string | null;
  content: string;
  parent_id?: string | null;
  reply_to_username?: string | null;
  is_founder: boolean;
  created_at: string;
  replies?: Comment[];
};

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  username?: string | null;
  role: "user" | "founder";
  avatar_url?: string | null;
};

export type UserNotification = {
  id: string;
  user_id: string;
  type: "upvote" | "milestone_100" | "top_3" | "reply" | "new_comment" | "system";
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
};

export type ListingPayload = Omit<
  Company,
  "id" | "slug" | "logo_url" | "created_at" | "status"
> & {
  logo_path?: string;
};
