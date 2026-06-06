import type { SupabaseClient } from "@supabase/supabase-js";

import {
  filesFromFormData,
  uploadImagesToBucket,
  type UploadBatchResult,
} from "@/infrastructure/supabase/upload-storage";

const BUCKET = "product-images";

export type VersionImageInsertResult = UploadBatchResult & {
  inserted: number;
  dbError?: string;
};

export async function insertVersionImagesFromForm(
  supabase: SupabaseClient,
  versionId: string,
  formData: FormData,
  fieldName = "images",
): Promise<VersionImageInsertResult> {
  const files = filesFromFormData(formData, fieldName);
  if (files.length === 0) {
    return { paths: [], failures: [], inserted: 0 };
  }

  const { count } = await supabase
    .from("product_version_images")
    .select("id", { count: "exact", head: true })
    .eq("version_id", versionId);

  const existingCount = count ?? 0;
  const upload = await uploadImagesToBucket(supabase, BUCKET, versionId, files);

  if (upload.paths.length === 0) {
    return { ...upload, inserted: 0 };
  }

  const rows = upload.paths.map((storage_path, index) => ({
    version_id: versionId,
    storage_path,
    sort_order: existingCount + index,
    is_primary: existingCount === 0 && index === 0,
  }));

  const { error } = await supabase.from("product_version_images").insert(rows);
  if (error) {
    return { ...upload, inserted: 0, dbError: error.message };
  }

  return { ...upload, inserted: rows.length };
}

export async function deleteVersionImageById(
  supabase: SupabaseClient,
  imageId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: row, error: fetchError } = await supabase
    .from("product_version_images")
    .select("id, version_id, storage_path, is_primary")
    .eq("id", imageId)
    .maybeSingle();

  if (fetchError || !row) {
    return { ok: false, error: fetchError?.message ?? "imagen no encontrada" };
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([row.storage_path as string]);

  if (storageError) {
    console.error("[deleteVersionImage] storage", storageError.message);
  }

  const { error: deleteError } = await supabase.from("product_version_images").delete().eq("id", imageId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  if (row.is_primary) {
    const { data: next } = await supabase
      .from("product_version_images")
      .select("id")
      .eq("version_id", row.version_id as string)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next?.id) {
      await supabase.from("product_version_images").update({ is_primary: true }).eq("id", next.id);
    }
  }

  return { ok: true };
}

export function formatVersionUploadFeedback(result: VersionImageInsertResult): string | null {
  if (result.inserted > 0 && result.failures.length === 0) {
    return `${result.inserted} imagen${result.inserted === 1 ? "" : "es"} subida${result.inserted === 1 ? "" : "s"} correctamente.`;
  }
  if (result.inserted > 0 && result.failures.length > 0) {
    return `${result.inserted} subida(s). Fallaron: ${result.failures.map((f) => `${f.fileName} (${f.reason})`).join(", ")}`;
  }
  if (result.dbError) return `Error al guardar en base de datos: ${result.dbError}`;
  if (result.failures.length > 0) {
    return result.failures.map((f) => `${f.fileName}: ${f.reason}`).join(" · ");
  }
  return null;
}
