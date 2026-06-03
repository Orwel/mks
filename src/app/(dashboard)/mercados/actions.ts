"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

function normalizeMarketCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 10);
}

export async function createMarket(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const code = normalizeMarketCode(String(formData.get("code") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const default_currency = String(formData.get("default_currency") ?? "").trim().toUpperCase();
  const default_payment_provider = String(formData.get("default_payment_provider") ?? "").trim();
  if (!code || !name || !default_currency || !default_payment_provider) return;

  const { error } = await supabase.from("markets").insert({
    code,
    name,
    default_currency,
    default_locale: String(formData.get("default_locale") ?? "es").trim() || "es",
    default_payment_provider,
    flag_emoji: String(formData.get("flag_emoji") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  });
  if (error) console.error("[createMarket]", error.message);
  revalidatePath("/mercados");
  revalidatePath("/");
}

export async function updateMarket(code: string, formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const name = String(formData.get("name") ?? "").trim();
  const default_currency = String(formData.get("default_currency") ?? "").trim().toUpperCase();
  const default_payment_provider = String(formData.get("default_payment_provider") ?? "").trim();
  if (!name || !default_currency || !default_payment_provider) return;

  const { error } = await supabase
    .from("markets")
    .update({
      name,
      default_currency,
      default_locale: String(formData.get("default_locale") ?? "es").trim() || "es",
      default_payment_provider,
      flag_emoji: String(formData.get("flag_emoji") ?? "").trim() || null,
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
      is_active: formData.get("is_active") === "on",
    })
    .eq("code", code);
  if (error) console.error("[updateMarket]", error.message);
  revalidatePath("/mercados");
  revalidatePath("/");
}

export async function deleteMarketForm(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("markets").delete().eq("code", code);
  if (error) console.error("[deleteMarket]", error.message);
  revalidatePath("/mercados");
  revalidatePath("/");
}
