import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,25}$/;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkName = (searchParams.get("check") || "").trim().toLowerCase();

    if (!checkName) {
      return NextResponse.json({ available: false, error: "Username required" }, { status: 400 });
    }

    if (!USERNAME_REGEX.test(checkName)) {
      return NextResponse.json({
        available: false,
        error: "Username must be 3-25 characters (letters, numbers, underscores only)",
      });
    }

    const admin = createAdminClient();

    // Check if user is checking their own current username
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    let currentUserId: string | null = null;

    if (token) {
      const { data: userData } = await admin.auth.getUser(token);
      currentUserId = userData?.user?.id ?? null;
    }

    const { data: existingUser, error } = await admin
      .from("user_profiles")
      .select("id, username")
      .ilike("username", checkName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (existingUser && existingUser.id !== currentUserId) {
      return NextResponse.json({ available: false, error: "Username is already taken" });
    }

    return NextResponse.json({ available: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to check username" },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = userData.user;
    const body = await request.json();
    const rawUsername = (body.username || "").trim();

    if (!rawUsername) {
      return NextResponse.json({ error: "Please enter a username" }, { status: 400 });
    }

    if (!USERNAME_REGEX.test(rawUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-25 characters using only letters, numbers, and underscores." },
        { status: 400 }
      );
    }

    // Check uniqueness (case-insensitive)
    const { data: conflict, error: conflictErr } = await admin
      .from("user_profiles")
      .select("id")
      .ilike("username", rawUsername)
      .neq("id", user.id)
      .maybeSingle();

    if (conflictErr) throw conflictErr;

    if (conflict) {
      return NextResponse.json(
        { error: "Username is already taken. Please choose another one." },
        { status: 409 }
      );
    }

    // Update user_profiles
    const { error: upsertErr } = await admin.from("user_profiles").upsert({
      id: user.id,
      email: user.email,
      username: rawUsername,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) throw upsertErr;

    // Update auth user metadata
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        username: rawUsername,
      },
    });

    return NextResponse.json({ success: true, username: rawUsername });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update username" },
      { status: 500 }
    );
  }
}
