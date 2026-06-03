"use server";

import { revalidatePath } from "next/cache";

import {
  formatBannerUploadFeedback,
  insertBannerImagesFromForm,
} from "@/infrastructure/supabase/banner-images";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { filesFromFormData } from "@/infrastructure/supabase/upload-storage";

const PUBLIC_PATHS = ["/", "/landing2", "/landing3", "/landing4"] as const;

export type DestacadoFormState = {
  ok: boolean;
  message?: string;
};

function revalidateDestacados() {
  revalidatePath("/destacados");
  revalidatePath("/banners");
  for (const path of PUBLIC_PATHS) {
    revalidatePath(path);
  }
}

function readDestacadoFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim() || null,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    link_url: String(formData.get("link_url") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
    starts_at: String(formData.get("starts_at") ?? "").trim() || null,
    ends_at: String(formData.get("ends_at") ?? "").trim() || null,
  };
}

export async function createDestacado(
  _prev: DestacadoFormState,
  formData: FormData,
): Promise<DestacadoFormState> {
  const uploads = filesFromFormData(formData, "images");
  if (uploads.length === 0) {
    return { ok: false, message: "Selecciona al menos una imagen para el destacado." };
  }

  const supabase = await createSupabaseServerClient();
  const fields = readDestacadoFields(formData);

  const { data: banner, error } = await supabase
    .from("banners")
    .insert({
      ...fields,
      image_url: "",
      position: "hero",
    })
    .select("id")
    .single();

  if (error || !banner?.id) {
    return { ok: false, message: error?.message ?? "No se pudo crear el destacado." };
  }

  const upload = await insertBannerImagesFromForm(supabase, banner.id as string, formData);
  const feedback = formatBannerUploadFeedback(upload);

  if (upload.inserted === 0) {
    await supabase.from("banners").delete().eq("id", banner.id);
    return {
      ok: false,
      message: feedback ?? "No se pudieron subir las imágenes. Revisa el formato y el tamaño (máx. 5 MB).",
    };
  }

  if (upload.primaryUrl) {
    await supabase.from("banners").update({ image_url: upload.primaryUrl }).eq("id", banner.id);
  }

  revalidateDestacados();
  let message = "Destacado creado.";
  if (feedback) message = `Destacado creado. ${feedback}`;
  return { ok: true, message };
}

export async function updateDestacadoForForm(
  id: string,
  _prev: DestacadoFormState,
  formData: FormData,
): Promise<DestacadoFormState> {
  return updateDestacado(id, _prev, formData);
}

export async function updateDestacado(
  id: string,
  _prev: DestacadoFormState,
  formData: FormData,
): Promise<DestacadoFormState> {
  const supabase = await createSupabaseServerClient();
  const fields = readDestacadoFields(formData);

  const { error } = await supabase
    .from("banners")
    .update({
      ...fields,
      position: "hero",
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  const uploads = filesFromFormData(formData, "images");
  if (uploads.length === 0) {
    revalidateDestacados();
    return { ok: true, message: "Destacado actualizado." };
  }

  const upload = await insertBannerImagesFromForm(supabase, id, formData);
  const feedback = formatBannerUploadFeedback(upload);

  if (upload.primaryUrl) {
    await supabase.from("banners").update({ image_url: upload.primaryUrl }).eq("id", id);
  }

  if (upload.inserted === 0 && uploads.length > 0) {
    return {
      ok: false,
      message: feedback ?? "No se pudieron subir las imágenes nuevas.",
    };
  }

  revalidateDestacados();
  let message = "Destacado actualizado.";
  if (feedback) message = `Destacado actualizado. ${feedback}`;
  return { ok: true, message };
}

export async function deleteDestacado(id: string): Promise<DestacadoFormState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) {
    return { ok: false, message: error.message };
  }
  revalidateDestacados();
  return { ok: true, message: "Destacado eliminado." };
}

export async function deleteDestacadoForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteDestacado(id);
}
