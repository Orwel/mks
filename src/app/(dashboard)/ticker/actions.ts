"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

async function nextTickerSortOrder(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data } = await supabase
    .from("ticker_messages")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}

export async function reorderTickerMessages(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const supabase = await createSupabaseServerClient();
  const results = await Promise.all(
    orderedIds.map((id, sort_order) =>
      supabase.from("ticker_messages").update({ sort_order }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[reorderTickerMessages]", failed.error.message);
    return;
  }
  revalidatePath("/ticker");
  revalidatePath("/");
}

export async function createTicker(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;
  const marketRaw = String(formData.get("market_code") ?? "").trim();
  const { error } = await supabase.from("ticker_messages").insert({
    message,
    link_url: String(formData.get("link_url") ?? "").trim() || null,
    market_code: marketRaw || null,
    sort_order: await nextTickerSortOrder(supabase),
    is_active: formData.get("is_active") === "on",
    starts_at: String(formData.get("starts_at") ?? "").trim() || null,
    ends_at: String(formData.get("ends_at") ?? "").trim() || null,
  });
  if (error) {
    console.error("[createTicker]", error.message);
    return;
  }
  revalidatePath("/ticker");
  revalidatePath("/");
}

export async function updateTicker(id: string, formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;
  const marketRaw = String(formData.get("market_code") ?? "").trim();
  const { error } = await supabase
    .from("ticker_messages")
    .update({
      message,
      link_url: String(formData.get("link_url") ?? "").trim() || null,
      market_code: marketRaw || null,
      is_active: formData.get("is_active") === "on",
      starts_at: String(formData.get("starts_at") ?? "").trim() || null,
      ends_at: String(formData.get("ends_at") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) {
    console.error("[updateTicker]", error.message);
    return;
  }
  revalidatePath("/ticker");
  revalidatePath("/");
}

export async function deleteTicker(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ticker_messages").delete().eq("id", id);
  if (error) {
    console.error("[deleteTicker]", error.message);
    return;
  }
  revalidatePath("/ticker");
  revalidatePath("/");
}

export async function deleteTickerForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteTicker(id);
}
