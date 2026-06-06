"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  deleteVersionImageById,
  formatVersionUploadFeedback,
  insertVersionImagesFromForm,
} from "@/infrastructure/supabase/version-images";
import { filesFromFormData } from "@/infrastructure/supabase/upload-storage";

export type ProductFormState = {
  ok: boolean;
  message?: string;
};

export type VersionImageUploadState = {
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

function revalidateMarketProductPaths(marketCode: string, slug?: string) {
  revalidatePath("/mercados");
  revalidatePath(`/mercados/${marketCode}/productos`);
  revalidatePath("/catalogo");
  revalidatePath("/");
  if (slug) revalidatePath(`/catalogo/${slug}`);
}

export async function createProductDraft(marketCode: string): Promise<{
  ok: boolean;
  id?: string;
  versionId?: string;
  message?: string;
}> {
  const code = marketCode.toUpperCase();
  const supabase = await createSupabaseServerClient();

  const [{ data: category, error: catError }, { data: market, error: marketError }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id")
        .eq("is_active", true)
        .not("parent_id", "is", null)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase.from("markets").select("code, default_currency").eq("code", code).maybeSingle(),
    ]);

  if (catError || !category?.id) {
    return {
      ok: false,
      message: catError?.message ?? "Crea al menos una subcategoría activa antes de añadir productos.",
    };
  }
  if (marketError || !market?.code) {
    return { ok: false, message: "Mercado no válido." };
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
      currency: market.default_currency,
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

  const productId = product.id as string;
  const { data: version, error: versionError } = await supabase
    .from("product_versions")
    .insert({
      product_id: productId,
      name: "Versión única",
      sort_order: 0,
      is_active: true,
    })
    .select("id")
    .single();

  if (versionError || !version?.id) {
    await supabase.from("products").delete().eq("id", productId);
    return { ok: false, message: versionError?.message ?? "No se pudo crear la versión." };
  }

  const { error: stockError } = await supabase.from("product_version_market_stock").insert({
    version_id: version.id,
    market_code: code,
    price: 0,
    currency: market.default_currency,
    stock: 0,
    is_active: true,
  });

  if (stockError) {
    await supabase.from("products").delete().eq("id", productId);
    return { ok: false, message: stockError.message };
  }

  revalidateMarketProductPaths(code);
  return { ok: true, id: productId, versionId: version.id as string };
}

export async function discardProductDraft(id: string, marketCode: string): Promise<void> {
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase.from("products").select("slug").eq("id", id).maybeSingle();
  if (!row?.slug || !isDraftSlug(row.slug as string)) return;

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[discardProductDraft]", error.message);
    return;
  }
  revalidateMarketProductPaths(marketCode.toUpperCase());
}

export async function finalizeProductFromDraft(
  marketCode: string,
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

  return saveProductWithVersions(supabase, marketCode, draftId, formData, "Producto creado.");
}

export async function updateProductForForm(
  marketCode: string,
  id: string,
  prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  return updateProduct(marketCode, id, prev, formData);
}

export async function updateProduct(
  marketCode: string,
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createSupabaseServerClient();
  return saveProductWithVersions(supabase, marketCode, id, formData, "Cambios guardados.");
}

async function saveProductWithVersions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  marketCode: string,
  productId: string,
  formData: FormData,
  successMessage: string,
): Promise<ProductFormState> {
  const code = marketCode.toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();

  if (!name || !categoryId) {
    return { ok: false, message: "Nombre y subcategoría son obligatorios." };
  }

  const { data: categoryRow } = await supabase
    .from("categories")
    .select("id, parent_id, is_active")
    .eq("id", categoryId)
    .maybeSingle();

  if (!categoryRow?.parent_id) {
    return { ok: false, message: "El producto debe asignarse a una subcategoría, no a una categoría raíz." };
  }
  if (!categoryRow.is_active) {
    return { ok: false, message: "La subcategoría seleccionada no está activa." };
  }

  if (!slug) slug = slugify(name);
  if (isDraftSlug(slug)) {
    return { ok: false, message: "El slug no puede empezar por «borrador-»." };
  }

  const { data: market } = await supabase
    .from("markets")
    .select("default_currency")
    .eq("code", code)
    .maybeSingle();
  if (!market?.default_currency) {
    return { ok: false, message: "Mercado no válido." };
  }

  const versionIds = formData.getAll("version_id").map((v) => String(v).trim()).filter(Boolean);
  const versionNames = formData.getAll("version_name").map((v) => String(v).trim());
  const versionSkus = formData.getAll("version_sku").map((v) => String(v).trim());
  const versionPrices = formData.getAll("version_price").map((v) => Number(v));
  const versionStocks = formData.getAll("version_stock").map((v) => Math.floor(Number(v)));
  const versionActives = formData.getAll("version_active");

  if (versionNames.length === 0) {
    return { ok: false, message: "El producto debe tener al menos una versión." };
  }

  for (let i = 0; i < versionNames.length; i++) {
    const vName = versionNames[i]?.trim();
    if (!vName) return { ok: false, message: "Todas las versiones necesitan un nombre." };
    const price = versionPrices[i];
    const stock = versionStocks[i];
    if (Number.isNaN(price) || price < 0 || Number.isNaN(stock) || stock < 0) {
      return { ok: false, message: "Precio o stock de versión no válidos." };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: productError } = await supabase
    .from("products")
    .update({
      name,
      slug,
      category_id: categoryId,
      description: String(formData.get("description") ?? "").trim() || null,
      is_featured: formData.get("is_featured") === "on",
      is_active: formData.get("is_active") === "on",
      updated_by: user?.id ?? null,
    })
    .eq("id", productId);

  if (productError) {
    return { ok: false, message: productError.message };
  }

  for (let i = 0; i < versionNames.length; i++) {
    const vName = versionNames[i]!.trim();
    const vSku = versionSkus[i]?.trim() || null;
    const price = versionPrices[i]!;
    const stock = versionStocks[i]!;
    const isActive = versionActives[i] !== "off";
    const versionId = versionIds[i] ?? "";

    if (versionId) {
      const { error: verErr } = await supabase
        .from("product_versions")
        .update({ name: vName, sku: vSku, sort_order: i, is_active: isActive })
        .eq("id", versionId);
      if (verErr) return { ok: false, message: verErr.message };

      const { error: stockErr } = await supabase.from("product_version_market_stock").upsert(
        {
          version_id: versionId,
          market_code: code,
          price,
          currency: market.default_currency,
          stock,
          is_active: isActive,
        },
        { onConflict: "version_id,market_code" },
      );
      if (stockErr) return { ok: false, message: stockErr.message };
    } else {
      const { data: newVersion, error: createVerErr } = await supabase
        .from("product_versions")
        .insert({
          product_id: productId,
          name: vName,
          sku: vSku,
          sort_order: i,
          is_active: isActive,
        })
        .select("id")
        .single();
      if (createVerErr || !newVersion?.id) {
        return { ok: false, message: createVerErr?.message ?? "No se pudo crear versión." };
      }

      const { error: stockErr } = await supabase.from("product_version_market_stock").insert({
        version_id: newVersion.id,
        market_code: code,
        price,
        currency: market.default_currency,
        stock,
        is_active: isActive,
      });
      if (stockErr) return { ok: false, message: stockErr.message };
    }
  }

  revalidateMarketProductPaths(code, slug);
  return { ok: true, message: successMessage };
}

export async function deleteProduct(marketCode: string, id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[deleteProduct]", error.message);
    return;
  }
  revalidateMarketProductPaths(marketCode.toUpperCase());
}

export async function deleteProductForm(marketCode: string, formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteProduct(marketCode, id);
}

async function productSlugForVersion(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  versionId: string,
): Promise<string | undefined> {
  const { data: version } = await supabase
    .from("product_versions")
    .select("product_id")
    .eq("id", versionId)
    .maybeSingle();
  if (!version?.product_id) return undefined;

  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", version.product_id as string)
    .maybeSingle();

  return product?.slug as string | undefined;
}

export async function uploadVersionImagesForm(
  marketCode: string,
  _prev: VersionImageUploadState,
  formData: FormData,
): Promise<VersionImageUploadState> {
  const versionId = String(formData.get("version_id") ?? "").trim();
  if (!versionId) {
    return { ok: false, message: "Versión no indicada." };
  }

  const files = filesFromFormData(formData, "images");
  if (files.length === 0) {
    return { ok: false, message: "Selecciona al menos una imagen." };
  }

  const supabase = await createSupabaseServerClient();
  const upload = await insertVersionImagesFromForm(supabase, versionId, formData);
  const feedback = formatVersionUploadFeedback(upload);

  const slug = await productSlugForVersion(supabase, versionId);

  revalidateMarketProductPaths(marketCode.toUpperCase(), slug);

  if (upload.inserted === 0) {
    return { ok: false, message: feedback ?? "No se pudieron subir las imágenes." };
  }

  return { ok: true, message: feedback ?? "Imágenes subidas." };
}

export async function deleteVersionImageForm(marketCode: string, formData: FormData): Promise<void> {
  const imageId = String(formData.get("image_id") ?? "");
  const versionId = String(formData.get("version_id") ?? "");
  if (!imageId) return;

  const supabase = await createSupabaseServerClient();
  const result = await deleteVersionImageById(supabase, imageId);
  if (!result.ok) {
    console.error("[deleteVersionImage]", result.error);
  }

  if (versionId) {
    const slug = await productSlugForVersion(supabase, versionId);
    revalidateMarketProductPaths(marketCode.toUpperCase(), slug);
  } else {
    revalidateMarketProductPaths(marketCode.toUpperCase());
  }
}
