import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export async function uploadPublicImage(
  supabase: SupabaseClient,
  file: File,
  folder: string,
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const mime = file.type.toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return { error: "Please upload a PNG, JPEG, WebP, or GIF image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Images must be 2MB or smaller." };
  }
  const ext = extensionFor(file.type);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from("logos").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error(error);
    return { error: "Could not upload image." };
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(path);
  return { path, publicUrl };
}

function extensionFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "img";
}
