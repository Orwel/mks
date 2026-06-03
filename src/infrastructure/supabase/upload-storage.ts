import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 5 * 1024 * 1024;

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const ALLOWED = new Set(Object.values(EXT_MIME));

export type UploadFailure = {
  fileName: string;
  reason: string;
};

export type UploadBatchResult = {
  paths: string[];
  failures: UploadFailure[];
};

function isFileLike(value: FormDataEntryValue): value is File {
  if (typeof value !== "object" || value === null) return false;
  if (value instanceof File) return value.size > 0;
  const candidate = value as { size?: number; arrayBuffer?: () => Promise<ArrayBuffer> };
  return typeof candidate.size === "number" && candidate.size > 0 && typeof candidate.arrayBuffer === "function";
}

export function filesFromFormData(formData: FormData, fieldName: string): File[] {
  return formData.getAll(fieldName).filter(isFileLike);
}

export function resolveImageMime(file: File): string | null {
  if (file.type && ALLOWED.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXT_MIME[ext]) return EXT_MIME[ext];
  return null;
}

export async function uploadImagesToBucket(
  supabase: SupabaseClient,
  bucket: string,
  folder: string,
  files: File[],
): Promise<UploadBatchResult> {
  const paths: string[] = [];
  const failures: UploadFailure[] = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      failures.push({ fileName: file.name, reason: "supera 5 MB" });
      continue;
    }

    const mime = resolveImageMime(file);
    if (!mime) {
      failures.push({ fileName: file.name, reason: "formato no permitido (usa JPG, PNG o WebP)" });
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    try {
      const body = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from(bucket).upload(path, body, {
        contentType: mime,
        upsert: false,
      });

      if (error) {
        failures.push({ fileName: file.name, reason: error.message });
        continue;
      }

      paths.push(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : "error al subir";
      failures.push({ fileName: file.name, reason: message });
    }
  }

  return { paths, failures };
}
