import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadContentImage, type ContentBucket, UploadError } from "@/lib/supabase/upload";

/**
 * Uploads directly to Supabase Storage (spec §21) and hands back the
 * public URL — no separate "save" step, the file is live the moment it's
 * picked. `value`/`onChange` hold just the URL string, same shape as every
 * other *_image_url / *_url column this writes to.
 */
export function ImageUploadField({
  label,
  bucket,
  value,
  onChange,
  hint,
}: {
  label: string;
  bucket: ContentBucket;
  value: string | null;
  onChange: (url: string | null) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadContentImage(bucket, file);
      onChange(url);
    } catch (err) {
      setError(err instanceof UploadError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>

      <div className="mt-1.5 flex items-start gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line bg-cream/60">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={22} className="text-muted" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-[3px] border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-teal disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {value ? "Replace image" : "Upload image"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-red-600"
            >
              <X size={12} /> Remove
            </button>
          )}
          {hint && <p className="text-xs text-muted">{hint}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
