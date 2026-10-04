import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 401 });
    }

    const user = userData.user;
    const body = await request.json();
    const newRole = body.role === "founder" ? "founder" : "user";

    // 1. Update user_profiles table (primary database record)
    const { error: profileErr } = await admin.from("user_profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
      role: newRole,
      updated_at: new Date().toISOString(),
    });

    if (profileErr) {
      console.error("user_profiles upsert error:", profileErr);
    }

    // 2. Update user metadata in auth.users (non-blocking)
    try {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          role: newRole,
        },
      });
    } catch (metaErr) {
      console.warn("auth.admin.updateUserById failed:", metaErr);
    }

    return NextResponse.json({ success: true, role: newRole });
  } catch (err: unknown) {
    console.error("Role update API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update role" },
      { status: 500 }
    );
  }
}
