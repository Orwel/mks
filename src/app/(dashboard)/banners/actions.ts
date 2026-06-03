"use server";

import { revalidatePath } from "next/cache";

import { insertBannerImagesFromForm } from "@/infrastructure/supabase/banner-images";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { filesFromFormData } from "@/infrastructure/supabase/upload-storage";

const PUBLIC_PATHS = ["/", "/landing2", "/landing3", "/landing4"] as const;

function revalidateBanners() {
  revalidatePath("/banners");
  revalidatePath("/destacados");
  for (const path of PUBLIC_PATHS) {
    revalidatePath(path);
  }
}

export async function createBanner(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const uploads = filesFromFormData(formData, "images");
  if (uploads.length === 0) return;

  const position = String(formData.get("position") ?? "hero") as "hero" | "secondary" | "sidebar";
  const { data: banner, error } = await supabase
    .from("banners")
    .insert({
      title: String(formData.get("title") ?? "").trim() || null,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      image_url: "",
      link_url: String(formData.get("link_url") ?? "").trim() || null,
      position,
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
      is_active: formData.get("is_active") === "on",
      starts_at: String(formData.get("starts_at") ?? "").trim() || null,
      ends_at: String(formData.get("ends_at") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !banner?.id) {
    console.error("[createBanner]", error?.message);
    return;
  }

  const upload = await insertBannerImagesFromForm(supabase, banner.id as string, formData);
  if (upload.primaryUrl) {
    await supabase.from("banners").update({ image_url: upload.primaryUrl }).eq("id", banner.id);
  }

  revalidateBanners();
}

export async function updateBanner(id: string, formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const position = String(formData.get("position") ?? "hero") as "hero" | "secondary" | "sidebar";

  const { error } = await supabase
    .from("banners")
    .update({
      title: String(formData.get("title") ?? "").trim() || null,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      link_url: String(formData.get("link_url") ?? "").trim() || null,
      position,
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
      is_active: formData.get("is_active") === "on",
      starts_at: String(formData.get("starts_at") ?? "").trim() || null,
      ends_at: String(formData.get("ends_at") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateBanner]", error.message);
    return;
  }

  const upload = await insertBannerImagesFromForm(supabase, id, formData);
  if (upload.primaryUrl) {
    await supabase.from("banners").update({ image_url: upload.primaryUrl }).eq("id", id);
  }

  revalidateBanners();
}

export async function deleteBanner(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) {
    console.error("[deleteBanner]", error.message);
    return;
  }
  revalidateBanners();
}

export async function deleteBannerForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteBanner(id);
}
