import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ upvoted_company_ids: [] });
    }

    const admin = createAdminClient();
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData?.user) {
      return NextResponse.json({ upvoted_company_ids: [] });
    }

    const { data: votes, error } = await admin
      .from("company_upvotes")
      .select("company_id")
      .eq("user_id", userData.user.id);

    if (error) {
      throw error;
    }

    const ids = (votes || []).map((v) => v.company_id);
    let upvotedCompanies: any[] = [];
    if (ids.length > 0) {
      const { data: comps } = await admin
        .from("companies")
        .select("id, slug, company_name, pitch, batch, location, logo_url, upvotes_count")
        .in("id", ids);
      upvotedCompanies = comps || [];
    }

    return NextResponse.json({
      upvoted_company_ids: ids,
      upvoted_companies: upvotedCompanies,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load upvotes" },
      { status: 500 }
    );
  }
}
