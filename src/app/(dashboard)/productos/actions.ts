"use server";

import { revalidatePath } from "next/cache";

import {
  deleteProductImageById,
  formatUploadFeedback,
  insertProductImagesFromForm,
} from "@/infrastructure/supabase/product-images";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { filesFromFormData } from "@/infrastructure/supabase/upload-storage";

export type ProductFormState = {
  ok: boolean;
  message?: string;
};

export type ProductImageUploadState = {
  ok: boolean;
  message?: string;
};

const DRAFT_SLUG_PREFIX = "borrador-";

function isDraftSlug(slug: string): boolean {
  return slug.startsWith(DRAFT_SLUG_PREFIX);
}

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

function revalidateProductPaths(slug?: string) {
  revalidatePath("/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  if (slug) revalidatePath(`/catalogo/${slug}`);
}

export async function createProductDraft(): Promise<{
  ok: boolean;
  id?: string;
  message?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("is_active", true)
    .not("parent_id", "is", null)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (catError || !category?.id) {
    return {
      ok: false,
      message: catError?.message ?? "Crea al menos una subcategoría activa antes de añadir productos.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const slug = `${DRAFT_SLUG_PREFIX}${crypto.randomUUID().slice(0, 8)}`;
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: "Borrador",
      slug,
      category_id: category.id as string,
      price: 0,
      stock: 0,
      currency: "COP",
      is_featured: false,
      is_active: false,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !product?.id) {
    return { ok: false, message: error?.message ?? "No se pudo iniciar el borrador." };
  }

  revalidatePath("/productos");
  return { ok: true, id: product.id as string };
}

export async function discardProductDraft(id: string): Promise<void> {
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase.from("products").select("slug").eq("id", id).maybeSingle();
  if (!row?.slug || !isDraftSlug(row.slug as string)) return;

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[discardProductDraft]", error.message);
    return;
  }
  revalidateProductPaths();
}

export async function finalizeProductFromDraft(
  draftId: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", draftId)
    .maybeSingle();

  if (!existing?.slug || !isDraftSlug(existing.slug as string)) {
    return { ok: false, message: "El borrador del producto no es válido. Cierra y vuelve a intentar." };
  }

  return saveProductFields(supabase, draftId, formData, "Producto creado.");
}

export async function uploadProductImagesForm(
  _prev: ProductImageUploadState,
  formData: FormData,
): Promise<ProductImageUploadState> {
  const productId = String(formData.get("product_id") ?? "").trim();
  if (!productId) {
    return { ok: false, message: "Producto no indicado." };
  }

  const files = filesFromFormData(formData, "images");
  if (files.length === 0) {
    return { ok: false, message: "Selecciona al menos una imagen." };
  }

  const supabase = await createSupabaseServerClient();
  const upload = await insertProductImagesFromForm(supabase, productId, formData);
  const feedback = formatUploadFeedback(upload);

  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();

  revalidateProductPaths(product?.slug as string | undefined);

  if (upload.inserted === 0) {
    return { ok: false, message: feedback ?? "No se pudieron subir las imágenes." };
  }

  return { ok: true, message: feedback ?? "Imágenes subidas." };
}

export async function updateProductForForm(
  id: string,
  prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  return updateProduct(id, prev, formData);
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  return saveProductFields(supabase, id, formData, "Cambios guardados.");
}

async function saveProductFields(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  id: string,
  formData: FormData,
  successMessage: string,
): Promise<ProductFormState> {
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const stock = Math.floor(Number(formData.get("stock") ?? 0));
  const currency = String(formData.get("currency") ?? "COP")
    .trim()
    .toUpperCase()
    .slice(0, 3);
  if (!name || !categoryId) {
    return { ok: false, message: "Nombre y categoría son obligatorios." };
  }
  if (!slug) slug = slugify(name);
  if (isDraftSlug(slug)) {
    return { ok: false, message: "El slug no puede empezar por «borrador-»." };
  }
  if (Number.isNaN(price) || price < 0 || Number.isNaN(stock) || stock < 0) {
    return { ok: false, message: "Precio o stock no válidos." };
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { ok: false, message: "Divisa no válida." };
  }

  const { data: currencyRow } = await supabase
    .from("currencies")
    .select("code")
    .eq("code", currency)
    .eq("is_active", true)
    .maybeSingle();
  if (!currencyRow) {
    return { ok: false, message: "La divisa seleccionada no existe." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("products")
    .update({
      name,
      slug,
      category_id: categoryId,
      price,
      currency,
      stock,
      description: String(formData.get("description") ?? "").trim() || null,
      sku: String(formData.get("sku") ?? "").trim() || null,
      is_featured: formData.get("is_featured") === "on",
      is_active: formData.get("is_active") === "on",
      updated_by: user?.id ?? null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateProductPaths(slug);
  return { ok: true, message: successMessage };
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[deleteProduct]", error.message);
    return;
  }
  revalidateProductPaths();
}

export async function deleteProductForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteProduct(id);
}

export async function deleteProductImageForm(formData: FormData): Promise<void> {
  const imageId = String(formData.get("image_id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  if (!imageId) return;

  const supabase = await createSupabaseServerClient();
  const result = await deleteProductImageById(supabase, imageId);
  if (!result.ok) {
    console.error("[deleteProductImage]", result.error);
  }

  revalidatePath("/productos");
  revalidatePath("/catalogo");
  if (productId) {
    const { data: product } = await supabase
      .from("products")
      .select("slug")
      .eq("id", productId)
      .maybeSingle();
    if (product?.slug) revalidatePath(`/catalogo/${product.slug as string}`);
  }
}
