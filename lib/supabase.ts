import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://sgfgsmoclawrjkdzgyqa.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZmdzbW9jbGF3cmprZHpneXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDM5OTQsImV4cCI6MjEwNDg3OTk5NH0.QTWibzIwaee0DfL8PlWqglUTiA_lXDrnX8p3Iy9QbWg";

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
}

/**
 * The service_role key bypasses Row Level Security. It must NEVER be hardcoded
 * or shipped to the browser. It is read only from the server environment
 * (.env.local locally, a Cloudflare Worker secret in production).
 */
export function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server.");
  }
  return key;
}

export function createAnonClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false },
  });
}

let browserClientInstance: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false },
    });
  }
  if (!browserClientInstance) {
    browserClientInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClientInstance;
}

export function createAdminClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
    auth: { persistSession: false },
  });
}

export function hasSupabaseConfig(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
