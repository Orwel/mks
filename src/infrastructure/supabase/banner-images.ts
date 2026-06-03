import type { SupabaseClient } from "@supabase/supabase-js";

import {
  filesFromFormData,
  uploadImagesToBucket,
  type UploadBatchResult,
} from "@/infrastructure/supabase/upload-storage";
import { publicStorageUrl } from "@/shared/lib/public-storage-url";

const BUCKET = "banners";

export type BannerImageInsertResult = UploadBatchResult & {
  inserted: number;
  primaryUrl: string | null;
  dbError?: string;
};

export async function insertBannerImagesFromForm(
  supabase: SupabaseClient,
  bannerId: string,
  formData: FormData,
  fieldName = "images",
): Promise<BannerImageInsertResult> {
  const files = filesFromFormData(formData, fieldName);
  if (files.length === 0) {
    return { paths: [], failures: [], inserted: 0, primaryUrl: null };
  }

  const upload = await uploadImagesToBucket(supabase, BUCKET, bannerId, files);
  if (upload.paths.length === 0) {
    return { ...upload, inserted: 0, primaryUrl: null };
  }

  const rows = upload.paths.map((storage_path, index) => ({
    banner_id: bannerId,
    storage_path,
    sort_order: index,
    is_primary: index === 0,
  }));

  const { error } = await supabase.from("banner_images").insert(rows);
  if (error) {
    console.error("[insertBannerImages]", error.message);
    return { ...upload, inserted: 0, primaryUrl: null, dbError: error.message };
  }

  return {
    ...upload,
    inserted: rows.length,
    primaryUrl: publicStorageUrl(BUCKET, upload.paths[0]!),
  };
}

export function formatBannerUploadFeedback(result: BannerImageInsertResult): string | null {
  if (result.inserted > 0 && result.failures.length === 0) {
    return `${result.inserted} imagen${result.inserted === 1 ? "" : "es"} subida${result.inserted === 1 ? "" : "s"} correctamente.`;
  }
  if (result.inserted > 0 && result.failures.length > 0) {
    return `${result.inserted} subida(s). Fallaron: ${result.failures.map((f) => `${f.fileName} (${f.reason})`).join(", ")}`;
  }
  if (result.dbError) return `Error al guardar imágenes: ${result.dbError}`;
  if (result.failures.length > 0) {
    return result.failures.map((f) => `${f.fileName}: ${f.reason}`).join(" · ");
  }
  return null;
}
