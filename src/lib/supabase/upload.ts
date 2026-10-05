import { supabase } from "@/lib/supabase/client";

export type ContentBucket = "public-assets" | "blog-images" | "gallery-images" | "profile-images";

const MAX_BYTES = 5 * 1024 * 1024; // matches the bucket's own file_size_limit (migration 20260930090900)
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class UploadError extends Error {}

/**
 * Uploads an image to one of the four public content buckets and registers
 * it in media_assets (spec's "Media Library" — migration 20260930090700),
 * so every upload is tracked regardless of which content record ends up
 * referencing it. Returns the public URL the caller stores on its own row
 * (e.g. procedures.featured_image_url).
 *
 * Client-side size/type checks here are a UX nicety only — the bucket's own
 * file_size_limit/allowed_mime_types (set in migration 20260930090900) and
 * the "staff upload" storage RLS policy are the real enforcement.
 */
export async function uploadContentImage(
  bucket: ContentBucket,
  file: File,
  altText?: string
): Promise<{ url: string; path: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError("Please upload a JPEG, PNG or WEBP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Images must be 5MB or smaller.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) throw new UploadError(uploadError.message);

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  const url = publicUrlData.publicUrl;

  const { data: userData } = await supabase.auth.getUser();

  // Registry insert failing shouldn't lose an otherwise-successful upload —
  // the file is already stored and usable — but it IS worth surfacing,
  // since it means the Media Library will be incomplete.
  const { error: registryError } = await supabase.from("media_assets").insert({
    bucket,
    path,
    url,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    alt_text: altText ?? null,
    uploaded_by: userData.user?.id ?? null,
  });
  if (registryError) {
    console.error("Upload succeeded but media_assets registry insert failed:", registryError);
  }

  return { url, path };
}

/** Removes a file from storage and its media_assets registry row. */
export async function deleteContentImage(bucket: ContentBucket, path: string) {
  await supabase.storage.from(bucket).remove([path]);
  await supabase.from("media_assets").delete().eq("bucket", bucket).eq("path", path);
}

/** Derives the storage path from a public URL this app generated, for deletion. */
export function pathFromPublicUrl(url: string): string | null {
  const marker = "/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length); // "<bucket>/<path>"
  const slashIdx = rest.indexOf("/");
  return slashIdx === -1 ? null : rest.slice(slashIdx + 1);
}
