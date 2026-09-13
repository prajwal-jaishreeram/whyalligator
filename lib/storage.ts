import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadPublicImage(
  supabase: SupabaseClient,
  file: File,
  folder: string,
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image." };
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
