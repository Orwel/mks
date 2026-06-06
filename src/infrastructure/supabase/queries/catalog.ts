import { cache } from "react";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getMarketCodeFromCookies } from "@/infrastructure/supabase/queries/markets";
import {
  getProductVersionsForMarket,
  type CatalogVersion,
} from "@/infrastructure/supabase/queries/product-versions";

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  product_count: number;
};

export type CatalogSubcategory = CatalogCategory & {
  parent_id: string;
  parent_slug: string;
  parent_name: string;
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
  parent_category_slug: string;
  parent_category_name: string;
  image_url: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
  default_version_id: string | null;
  default_version_name: string | null;
  market_code: string;
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
  /** Categorías raíz (sin parent_id). */
  categories: CatalogCategory[];
  subcategories: CatalogSubcategory[];
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

async function resolveCatalogMarketCode(): Promise<string> {
  const code = await getMarketCodeFromCookies();
  return code ?? "CO";
}

async function loadDefaultVersionsByProduct(
  productIds: string[],
  marketCode: string,
): Promise<Map<string, CatalogVersion>> {
  const map = new Map<string, CatalogVersion>();
  if (productIds.length === 0) return map;

  await Promise.all(
    productIds.map(async (productId) => {
      const versions = await getProductVersionsForMarket(productId, marketCode);
      const inStock = versions.filter((v) => v.available_stock > 0);
      const pick = inStock.sort((a, b) => a.price - b.price)[0] ?? versions[0];
      if (pick) map.set(productId, pick);
    }),
  );

  return map;
}

function versionPrimaryImage(version: CatalogVersion | undefined): string | null {
  if (!version?.images.length) return null;
  const primary = version.images.find((i) => i.is_primary) ?? version.images[0];
  return primary?.url ?? null;
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
    subcategories: [],
    products: [],
    metadataFacets: [],
    priceRange: { min: 0, max: 0 },
  };

  if (!hasSupabaseEnv()) return empty;

  try {
    const supabase = await createSupabaseServerClient();
    const marketCode = await resolveCatalogMarketCode();

    const [categoriesRes, productsRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, slug, name, description, image_url, sort_order, parent_id")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("products_market_catalog")
        .select(
          "id, slug, name, description, price, currency, available_stock, sku, is_featured, is_active, category_id, metadata, updated_at, market_code",
        )
        .eq("market_code", marketCode)
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

    type CatRow = {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      image_url: string | null;
      parent_id: string | null;
    };

    const catMap = new Map<string, CatRow>();
    for (const c of categoriesRaw) {
      catMap.set(c.id as string, {
        id: c.id as string,
        slug: c.slug as string,
        name: c.name as string,
        description: (c.description as string | null) ?? null,
        image_url: (c.image_url as string | null) ?? null,
        parent_id: (c.parent_id as string | null) ?? null,
      });
    }

    const countByCategory = new Map<string, number>();
    for (const p of productsRaw) {
      countByCategory.set(p.category_id, (countByCategory.get(p.category_id) ?? 0) + 1);
    }

    const rootsRaw = categoriesRaw.filter((c) => !(c.parent_id as string | null));
    const subsRaw = categoriesRaw.filter((c) => (c.parent_id as string | null));

    function rootProductCount(rootId: string): number {
      return subsRaw
        .filter((s) => (s.parent_id as string) === rootId)
        .reduce((sum, s) => sum + (countByCategory.get(s.id as string) ?? 0), 0);
    }

    const categories: CatalogCategory[] = rootsRaw.map((c) => ({
      id: c.id as string,
      slug: c.slug as string,
      name: c.name as string,
      description: (c.description as string | null) ?? null,
      image_url: (c.image_url as string | null) ?? null,
      product_count: rootProductCount(c.id as string),
    }));

    const subcategories: CatalogSubcategory[] = subsRaw.map((c) => {
      const parent = catMap.get(c.parent_id as string);
      return {
        id: c.id as string,
        slug: c.slug as string,
        name: c.name as string,
        description: (c.description as string | null) ?? null,
        image_url: (c.image_url as string | null) ?? null,
        product_count: countByCategory.get(c.id as string) ?? 0,
        parent_id: c.parent_id as string,
        parent_slug: parent?.slug ?? "",
        parent_name: parent?.name ?? "",
      };
    });

    const productIds = productsRaw.map((p) => p.id);
    const defaultVersions = await loadDefaultVersionsByProduct(productIds, marketCode);
    const imagesByProduct = new Map<string, string>();
    for (const [pid, version] of defaultVersions) {
      const url = versionPrimaryImage(version);
      if (url) imagesByProduct.set(pid, url);
    }

    const products: CatalogProduct[] = productsRaw.map((p) => {
      const cat = catMap.get(p.category_id);
      const parent = cat?.parent_id ? catMap.get(cat.parent_id) : null;
      const defaultVersion = defaultVersions.get(p.id);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: Number(p.price ?? 0),
        currency: String(p.currency ?? "COP"),
        available_stock: Number(p.available_stock ?? 0),
        sku: p.sku,
        is_featured: p.is_featured,
        category_id: p.category_id,
        category_slug: cat?.slug ?? "",
        category_name: cat?.name ?? "",
        parent_category_slug: parent?.slug ?? "",
        parent_category_name: parent?.name ?? "",
        image_url: imagesByProduct.get(p.id) ?? null,
        metadata: (p.metadata ?? {}) as Record<string, unknown>,
        updated_at: p.updated_at,
        default_version_id: defaultVersion?.id ?? null,
        default_version_name: defaultVersion?.name ?? null,
        market_code: marketCode,
      };
    });

    const prices = products.map((p) => p.price);
    const priceRange = {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };

    return {
      categories,
      subcategories,
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

export type ProductDetailVersion = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  currency: string;
  available_stock: number;
  images: ProductDetailImage[];
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
  parent_category_slug: string;
  parent_category_name: string;
  images: ProductDetailImage[];
  metadata: Record<string, unknown>;
  market_code: string;
  versions: ProductDetailVersion[];
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!hasSupabaseEnv() || !slug.trim()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const marketCode = await resolveCatalogMarketCode();

    const { data: row, error } = await supabase
      .from("products_market_catalog")
      .select(
        "id, slug, name, description, price, currency, available_stock, sku, is_featured, is_active, category_id, metadata, market_code",
      )
      .eq("slug", slug)
      .eq("market_code", marketCode)
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
      market_code: string;
    };

    const { data: category } = await supabase
      .from("categories")
      .select("slug, name, parent_id")
      .eq("id", product.category_id)
      .eq("is_active", true)
      .maybeSingle();

    let parentCategory: { slug: string; name: string } | null = null;
    const parentId = category?.parent_id as string | null | undefined;
    if (parentId) {
      const { data: parent } = await supabase
        .from("categories")
        .select("slug, name")
        .eq("id", parentId)
        .eq("is_active", true)
        .maybeSingle();
      if (parent) {
        parentCategory = {
          slug: parent.slug as string,
          name: parent.name as string,
        };
      }
    }

    const catalogVersions = await getProductVersionsForMarket(product.id, marketCode);
    const versions: ProductDetailVersion[] = catalogVersions.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      currency: v.currency,
      available_stock: v.available_stock,
      images: v.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
      })),
    }));

    const defaultVersion =
      versions.find((v) => v.available_stock > 0) ?? versions[0] ?? null;
    const images: ProductDetailImage[] = defaultVersion?.images ?? [];

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: defaultVersion?.price ?? Number(product.price ?? 0),
      currency: defaultVersion?.currency ?? String(product.currency ?? "COP"),
      available_stock: defaultVersion?.available_stock ?? Number(product.available_stock ?? 0),
      sku: defaultVersion?.sku ?? product.sku,
      is_featured: product.is_featured,
      category_slug: (category?.slug as string) ?? "",
      category_name: (category?.name as string) ?? "",
      parent_category_slug: parentCategory?.slug ?? "",
      parent_category_name: parentCategory?.name ?? "",
      images,
      metadata: (product.metadata ?? {}) as Record<string, unknown>,
      market_code: marketCode,
      versions,
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
    const marketCode = await resolveCatalogMarketCode();

    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .maybeSingle();

    if (!category?.id) return [];

    const { data: productsRaw } = await supabase
      .from("products_market_catalog")
      .select(
        "id, slug, name, description, price, currency, available_stock, sku, is_featured, is_active, category_id, metadata, updated_at, market_code",
      )
      .eq("market_code", marketCode)
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
    const defaultVersions = await loadDefaultVersionsByProduct(productIds, marketCode);
    const imagesByProduct = new Map<string, string>();
    for (const [pid, version] of defaultVersions) {
      const url = versionPrimaryImage(version);
      if (url) imagesByProduct.set(pid, url);
    }

    const { data: categoryRow } = await supabase
      .from("categories")
      .select("slug, name, parent_id")
      .eq("id", category.id as string)
      .maybeSingle();

    let parentCategory: { slug: string; name: string } | null = null;
    const parentId = categoryRow?.parent_id as string | null | undefined;
    if (parentId) {
      const { data: parent } = await supabase
        .from("categories")
        .select("slug, name")
        .eq("id", parentId)
        .maybeSingle();
      if (parent) {
        parentCategory = {
          slug: parent.slug as string,
          name: parent.name as string,
        };
      }
    }

    return rows.map((p) => {
      const defaultVersion = defaultVersions.get(p.id);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: Number(p.price ?? 0),
        currency: String(p.currency ?? "COP"),
        available_stock: Number(p.available_stock ?? 0),
        sku: p.sku,
        is_featured: p.is_featured,
        category_id: p.category_id,
        category_slug: (categoryRow?.slug as string) ?? categorySlug,
        category_name: (categoryRow?.name as string) ?? "",
        parent_category_slug: parentCategory?.slug ?? "",
        parent_category_name: parentCategory?.name ?? "",
        image_url: imagesByProduct.get(p.id) ?? null,
        metadata: (p.metadata ?? {}) as Record<string, unknown>,
        updated_at: p.updated_at,
        default_version_id: defaultVersion?.id ?? null,
        default_version_name: defaultVersion?.name ?? null,
        market_code: marketCode,
      };
    });
  } catch {
    return [];
  }
}

export const getRelatedProductsCached = cache(getRelatedProducts);
