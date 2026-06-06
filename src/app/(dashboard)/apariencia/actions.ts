"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function updateSiteSettings(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const brand_colors = {
    pink: String(formData.get("color_pink") ?? "").trim(),
    cyan: String(formData.get("color_cyan") ?? "").trim(),
    ink: String(formData.get("color_ink") ?? "").trim(),
    cream: String(formData.get("color_cream") ?? "").trim(),
  };

  const hero = {
    badge: String(formData.get("hero_badge") ?? "").trim(),
    title: String(formData.get("hero_title") ?? "").trim(),
    subtitle: String(formData.get("hero_subtitle") ?? "").trim(),
    cta_catalog: String(formData.get("hero_cta_catalog") ?? "").trim(),
    cta_login: String(formData.get("hero_cta_login") ?? "").trim(),
    bg_from: String(formData.get("hero_bg_from") ?? "").trim(),
    bg_via: String(formData.get("hero_bg_via") ?? "").trim(),
    bg_to: String(formData.get("hero_bg_to") ?? "").trim(),
  };

  const footer = {
    tagline: String(formData.get("footer_tagline") ?? "").trim(),
    copyright: String(formData.get("footer_copyright") ?? "").trim(),
    terms_label: String(formData.get("footer_terms_label") ?? "").trim(),
    privacy_label: String(formData.get("footer_privacy_label") ?? "").trim(),
  };

  const buttons = {
    add_to_cart: String(formData.get("btn_add_to_cart") ?? "").trim(),
    view_detail: String(formData.get("btn_view_detail") ?? "").trim(),
    view_catalog: String(formData.get("btn_view_catalog") ?? "").trim(),
    apply_filters: String(formData.get("btn_apply_filters") ?? "").trim(),
    clear_filters: String(formData.get("btn_clear_filters") ?? "").trim(),
  };

  const sections = {
    featured_bg: String(formData.get("section_featured_bg") ?? "").trim(),
    categories_bg: String(formData.get("section_categories_bg") ?? "").trim(),
    catalog_title: String(formData.get("section_catalog_title") ?? "").trim(),
  };

  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    brand_colors,
    hero,
    footer,
    buttons,
    sections,
    updated_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/apariencia");
  revalidatePath("/");
  return { ok: true, message: "Apariencia guardada." };
}
