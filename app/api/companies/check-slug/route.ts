import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const RESERVED_SLUGS = new Set([
  "new",
  "edit",
  "api",
  "admin",
  "jobs",
  "about",
  "login",
  "signup",
  "dashboard",
  "resources",
  "companies",
  "static",
  "_next",
  "favicon.ico",
  "sitemap.xml",
  "robots.txt",
  "categories",
  "batch",
  "industry",
  "leaderboard",
  "pricing",
  "contact",
  "terms",
  "privacy",
  "help",
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSlug = searchParams.get("slug") || "";
    const currentId = searchParams.get("currentId") || "";

    const cleanSlug = rawSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleanSlug) {
      return NextResponse.json({ available: false, error: "Username cannot be empty" });
    }

    if (cleanSlug.length < 2) {
      return NextResponse.json({ available: false, error: "Username must be at least 2 characters" });
    }

    if (cleanSlug.length > 50) {
      return NextResponse.json({ available: false, error: "Username must be 50 characters or less" });
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(cleanSlug)) {
      return NextResponse.json({
        available: false,
        error: "Username can only contain lowercase letters, numbers, and hyphens",
      });
    }

    if (RESERVED_SLUGS.has(cleanSlug)) {
      return NextResponse.json({
        available: false,
        error: `"${cleanSlug}" is reserved. Please pick another name.`,
      });
    }

    const admin = createAdminClient();
    let query = admin.from("companies").select("id").eq("slug", cleanSlug);

    if (currentId) {
      query = query.neq("id", currentId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error checking slug availability:", error);
      return NextResponse.json({ available: false, error: "Error checking username" }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ available: false, error: "This company username is already taken" });
    }

    return NextResponse.json({ available: true, slug: cleanSlug });
  } catch (err: unknown) {
    return NextResponse.json(
      { available: false, error: err instanceof Error ? err.message : "Error checking username" },
      { status: 500 }
    );
  }
}
