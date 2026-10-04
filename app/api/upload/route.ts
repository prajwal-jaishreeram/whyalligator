import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { uploadPublicImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid user token." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "founders").trim();

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const targetFolder = folder === "logos" ? "logos" : "founders";
    const uploaded = await uploadPublicImage(admin, file, targetFolder);

    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }

    return NextResponse.json({
      publicUrl: uploaded.publicUrl,
      path: uploaded.path,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image upload failed." },
      { status: 500 }
    );
  }
}
