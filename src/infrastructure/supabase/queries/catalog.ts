import { cache } from "react";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { publicStorageUrl } from "@/shared/lib/public-storage-url";

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  product_count: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  available_stock: number;
  sku: string | null;
  is_featured: boolean;
  category_id: string;
  category_slug: string;
  category_name: string;
  image_url: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export type MetadataFacetOption = {
  value: string;
  label: string;
  count: number;
};

export type MetadataFacet = {
  key: string;
  label: string;
  options: MetadataFacetOption[];
};

export type CatalogPageData = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  metadataFacets: MetadataFacet[];
  priceRange: { min: number; max: number };
};

function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.length &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
  );
}

function facetLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function metadataValueLabel(value: unknown): string {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function metadataValueKey(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null || value === undefined) return "";
  return String(value);
}

export function buildMetadataFacets(products: CatalogProduct[]): MetadataFacet[] {
  const byKey = new Map<string, Map<string, { label: string; count: number }>>();

  for (const product of products) {
    const meta = product.metadata;
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) continue;

    for (const [key, raw] of Object.entries(meta)) {
      if (raw === null || raw === undefined || raw === "") continue;
      if (typeof raw === "object") continue;

      const valueKey = metadataValueKey(raw);
      if (!valueKey) continue;

      if (!byKey.has(key)) byKey.set(key, new Map());
      const options = byKey.get(key)!;
      const existing = options.get(valueKey);
      if (existing) {
        existing.count += 1;
      } else {
        options.set(valueKey, {
          label: metadataValueLabel(raw),
          count: 1,
        });
      }
    }
  }

  return [...byKey.entries()]
    .map(([key, options]) => ({
      key,
      label: facetLabel(key),
      options: [...options.entries()]
        .map(([value, { label, count }]) => ({ value, label, count }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export async function getCatalogPageData(): Promise<CatalogPageData> {
  const empty: CatalogPageData = {
    categories: [],
    products: [],
    metadataFacets: [],
    priceRange: { min: 0, max: 0 },
  };

  if (!hasSupabaseEnv()) return empty;

  try {
    const supabase = await createSupabaseServerClient();

    const [categoriesRes, productsRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, slug, name, description, image_url, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("products_with_available_stock")
        .select(
          "id, slug, name, description, price, currency, available_stock, sku, is_featured, is_active, category_id, metadata, updated_at",
        )
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    const categoriesRaw = categoriesRes.data ?? [];
    const productsRaw = (productsRes.data ?? []) as {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      price: number;
      currency: string;
      available_stock: number;
      sku: string | null;
      is_featured: boolean;
      category_id: string;
      metadata: Record<string, unknown> | null;
      updated_at: string;
    }[];

    const catMap = new Map<
      string,
      { slug: string; name: string; description: string | null; image_url: string | null }
    >();
    for (const c of categoriesRaw) {
      catMap.set(c.id as string, {
        slug: c.slug as string,
        name: c.name as string,
        description: (c.description as string | null) ?? null,
        image_url: (c.image_url as string | null) ?? null,
      });
    }

    const countByCategory = new Map<string, number>();
    for (const p of productsRaw) {
      countByCategory.set(p.category_id, (countByCategory.get(p.category_id) ?? 0) + 1);
    }

    const categories: CatalogCategory[] = categoriesRaw.map((c) => ({
      id: c.id as string,
      slug: c.slug as string,
      name: c.name as string,
      description: (c.description as string | null) ?? null,
      image_url: (c.image_url as string | null) ?? null,
      product_count: countByCategory.get(c.id as string) ?? 0,
    }));

    const productIds = productsRaw.map((p) => p.id);
    const imagesByProduct = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: images } = await supabase
        .from("product_images")
        .select("product_id, storage_path, is_primary, sort_order")
        .in("product_id", productIds)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true });

      for (const row of images ?? []) {
        const pid = row.product_id as string;
        if (!imagesByProduct.has(pid)) {
          imagesByProduct.set(
            pid,
            publicStorageUrl("product-images", row.storage_path as string),
          );
        }
      }
    }

    const products: CatalogProduct[] = productsRaw.map((p) => {
      const cat = catMap.get(p.category_id);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        currency: p.currency,
        available_stock: Number(p.available_stock),
        sku: p.sku,
        is_featured: p.is_featured,
        category_id: p.category_id,
        category_slug: cat?.slug ?? "",
        category_name: cat?.name ?? "",
        image_url: imagesByProduct.get(p.id) ?? null,
        metadata: (p.metadata ?? {}) as Record<string, unknown>,
        updated_at: p.updated_at,
      };
    });

    const prices = products.map((p) => p.price);
    const priceRange = {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };

    return {
      categories,
      products,
      metadataFacets: buildMetadataFacets(products),
      priceRange,
    };
  } catch {
    return empty;
  }
}

export const getCatalogPageDataCached = cache(getCatalogPageData);

export type ProductDetailImage = {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  available_stock: number;
  sku: string | null;
  is_featured: boolean;
  category_slug: string;
  category_name: string;
  images: ProductDetailImage[];
  metadata: Record<string, unknown>;
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!hasSupabaseEnv() || !slug.trim()) return null;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: row, error } = await supabase
      .from("products_with_available_stock")
      .select(
        "id, slug, name, description, price, currency, available_stock, sku, is_featured, is_active, category_id, metadata",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !row) return null;

    const product = row as {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      price: number;
      currency: string;
      available_stock: number;
      sku: string | null;
      is_featured: boolean;
      category_id: string;
      metadata: Record<string, unknown> | null;
    };

    const { data: category } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("id", product.category_id)
      .eq("is_active", true)
      .maybeSingle();

    const { data: imageRows } = await supabase
      .from("product_images")
      .select("id, storage_path, alt_text, is_primary, sort_order")
      .eq("product_id", product.id)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true });

    const images: ProductDetailImage[] = (imageRows ?? []).map((img) => ({
      id: img.id as string,
      url: publicStorageUrl("product-images", img.storage_path as string),
      alt_text: (img.alt_text as string | null) ?? null,
      is_primary: Boolean(img.is_primary),
    }));

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      currency: product.currency,
      available_stock: Number(product.available_stock),
      sku: product.sku,
      is_featured: product.is_featured,
      category_slug: (category?.slug as string) ?? "",
      category_name: (category?.name as string) ?? "",
      images,
      metadata: (product.metadata ?? {}) as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

export const getProductBySlugCached = cache(getProductBySlug);

export async function getRelatedProducts(
  categorySlug: string,
  excludeProductId: string,
  limit = 4,
): Promise<CatalogProduct[]> {
  if (!hasSupabaseEnv() || !categorySlug.trim()) return [];

  try {
    const supabase = await createSupabaseServerClient();

    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .maybeSingle();

    if (!category?.id) return [];

    const { data: productsRaw } = await supabase
      .from("products_with_available_stock")
      .select(
        "id, slug, name, description, price, currency, available_stock, sku, is_featured, is_active, category_id, metadata, updated_at",
      )
      .eq("is_active", true)
      .eq("category_id", category.id as string)
      .neq("id", excludeProductId)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
      .limit(limit);

    const rows = (productsRaw ?? []) as {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      price: number;
      currency: string;
      available_stock: number;
      sku: string | null;
      is_featured: boolean;
      category_id: string;
      metadata: Record<string, unknown> | null;
      updated_at: string;
    }[];

    if (rows.length === 0) return [];

    const productIds = rows.map((p) => p.id);
    const imagesByProduct = new Map<string, string>();
    const { data: images } = await supabase
      .from("product_images")
      .select("product_id, storage_path, is_primary, sort_order")
      .in("product_id", productIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true });

    for (const row of images ?? []) {
      const pid = row.product_id as string;
      if (!imagesByProduct.has(pid)) {
        imagesByProduct.set(pid, publicStorageUrl("product-images", row.storage_path as string));
      }
    }

    const { data: categoryRow } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("id", category.id as string)
      .maybeSingle();

    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      currency: p.currency,
      available_stock: Number(p.available_stock),
      sku: p.sku,
      is_featured: p.is_featured,
      category_id: p.category_id,
      category_slug: (categoryRow?.slug as string) ?? categorySlug,
      category_name: (categoryRow?.name as string) ?? "",
      image_url: imagesByProduct.get(p.id) ?? null,
      metadata: (p.metadata ?? {}) as Record<string, unknown>,
      updated_at: p.updated_at,
    }));
  } catch {
    return [];
  }
}

export const getRelatedProductsCached = cache(getRelatedProducts);
