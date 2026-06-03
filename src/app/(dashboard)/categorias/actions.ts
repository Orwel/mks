"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function nextCategorySortOrder(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const supabase = await createSupabaseServerClient();
  const results = await Promise.all(
    orderedIds.map((id, sort_order) => supabase.from("categories").update({ sort_order }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[reorderCategories]", failed.error.message);
    return;
  }
  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

export async function createCategory(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  if (!name) return;
  if (!slug) slug = slugify(name);
  const parentRaw = String(formData.get("parent_id") ?? "").trim();
  const parent_id = parentRaw || null;
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description: String(formData.get("description") ?? "").trim() || null,
    parent_id,
    sort_order: await nextCategorySortOrder(supabase),
    is_active: formData.get("is_active") === "on",
    image_url: String(formData.get("image_url") ?? "").trim() || null,
  });
  if (error) {
    console.error("[createCategory]", error.message);
    return;
  }
  revalidatePath("/categorias");
  revalidatePath("/");
}

export async function updateCategory(id: string, formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  if (!name) return;
  if (!slug) slug = slugify(name);
  const parentRaw = String(formData.get("parent_id") ?? "").trim();
  const parent_id = parentRaw || null;
  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      parent_id,
      is_active: formData.get("is_active") === "on",
      image_url: String(formData.get("image_url") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) {
    console.error("[updateCategory]", error.message);
    return;
  }
  revalidatePath("/categorias");
  revalidatePath("/");
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    console.error("[deleteCategory]", error.message);
    return;
  }
  revalidatePath("/categorias");
  revalidatePath("/");
}

export async function deleteCategoryForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteCategory(id);
}
