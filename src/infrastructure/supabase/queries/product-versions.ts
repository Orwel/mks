import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { publicStorageUrl } from "@/shared/lib/public-storage-url";

export type ProductVersionRow = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ProductVersionMarketStockRow = {
  id: string;
  version_id: string;
  market_code: string;
  price: number;
  currency: string;
  stock: number;
  is_active: boolean;
};

export type VersionImageRow = {
  id: string;
  version_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type MarketProductVersionAdmin = ProductVersionRow & {
  marketStock: ProductVersionMarketStockRow | null;
  images: VersionImageRow[];
};

export type MarketProductAdminRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string;
  categoryName: string;
  is_featured: boolean;
  is_active: boolean;
  totalStock: number;
  minPrice: number | null;
  currency: string;
  versionCount: number;
  versions: MarketProductVersionAdmin[];
};

type CategoryRow = { id: string; name: string };
type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string;
  is_featured: boolean;
  is_active: boolean;
  categories: CategoryRow | CategoryRow[] | null;
};

function categoryName(p: ProductRow): string {
  const c = p.categories;
  if (!c) return "—";
  if (Array.isArray(c)) return c[0]?.name ?? "—";
  return c.name;
}

export async function getMarketByCodeOrNull(code: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("markets")
    .select("code, name, default_currency, flag_emoji")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  return data as { code: string; name: string; default_currency: string; flag_emoji: string | null } | null;
}

export async function getMarketProductsAdmin(marketCode: string): Promise<MarketProductAdminRow[]> {
  const supabase = await createSupabaseServerClient();
  const code = marketCode.toUpperCase();

  const [{ data: products, error: prodErr }, { data: versions, error: verErr }, { data: stocks, error: stockErr }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, slug, name, description, category_id, is_featured, is_active, categories(id, name)")
        .not("slug", "like", "borrador-%")
        .order("name"),
      supabase.from("product_versions").select("id, product_id, name, sku, sort_order, is_active").order("sort_order"),
      supabase
        .from("product_version_market_stock")
        .select("id, version_id, market_code, price, currency, stock, is_active")
        .eq("market_code", code),
    ]);

  if (prodErr) throw new Error(prodErr.message);
  if (verErr) throw new Error(verErr.message);
  if (stockErr) throw new Error(stockErr.message);

  const versionIds = (versions ?? []).map((v) => v.id as string);
  const imagesByVersion = new Map<string, VersionImageRow[]>();

  if (versionIds.length > 0) {
    const { data: images } = await supabase
      .from("product_version_images")
      .select("id, version_id, storage_path, alt_text, sort_order, is_primary")
      .in("version_id", versionIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true });

    for (const row of images ?? []) {
      const vid = row.version_id as string;
      const list = imagesByVersion.get(vid) ?? [];
      list.push({
        id: row.id as string,
        version_id: vid,
        url: publicStorageUrl("product-images", row.storage_path as string),
        alt_text: (row.alt_text as string | null) ?? null,
        sort_order: Number(row.sort_order),
        is_primary: Boolean(row.is_primary),
      });
      imagesByVersion.set(vid, list);
    }
  }

  const stockByVersion = new Map<string, ProductVersionMarketStockRow>();
  for (const row of stocks ?? []) {
    stockByVersion.set(row.version_id as string, {
      id: row.id as string,
      version_id: row.version_id as string,
      market_code: row.market_code as string,
      price: Number(row.price),
      currency: String(row.currency).trim(),
      stock: Number(row.stock),
      is_active: Boolean(row.is_active),
    });
  }

  const versionsByProduct = new Map<string, MarketProductVersionAdmin[]>();
  for (const v of versions ?? []) {
    const vid = v.id as string;
    const pid = v.product_id as string;
    const list = versionsByProduct.get(pid) ?? [];
    list.push({
      id: vid,
      product_id: pid,
      name: v.name as string,
      sku: (v.sku as string | null) ?? null,
      sort_order: Number(v.sort_order),
      is_active: Boolean(v.is_active),
      marketStock: stockByVersion.get(vid) ?? null,
      images: imagesByVersion.get(vid) ?? [],
    });
    versionsByProduct.set(pid, list);
  }

  return ((products ?? []) as unknown as ProductRow[]).map((p) => {
    const pVersions = versionsByProduct.get(p.id) ?? [];
    const activeStocks = pVersions
      .filter((v) => v.is_active && v.marketStock?.is_active)
      .map((v) => v.marketStock!);
    const totalStock = activeStocks.reduce((sum, s) => sum + s.stock, 0);
    const prices = activeStocks.map((s) => s.price);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const currency = activeStocks[0]?.currency ?? "COP";

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      category_id: p.category_id,
      categoryName: categoryName(p),
      is_featured: p.is_featured,
      is_active: p.is_active,
      totalStock,
      minPrice,
      currency,
      versionCount: pVersions.length,
      versions: pVersions,
    };
  });
}

export async function getProductVersionsWithStock(productId: string, marketCode: string) {
  const supabase = await createSupabaseServerClient();
  const code = marketCode.toUpperCase();

  const { data: versions, error } = await supabase
    .from("product_versions")
    .select(
      "id, product_id, name, sku, sort_order, is_active, product_version_market_stock(id, version_id, market_code, price, currency, stock, is_active)",
    )
    .eq("product_id", productId)
    .order("sort_order");

  if (error) throw new Error(error.message);

  return (versions ?? []).map((v) => {
    const stocks = (v.product_version_market_stock ?? []) as ProductVersionMarketStockRow[];
    const marketStock = stocks.find((s) => s.market_code === code) ?? null;
    return {
      id: v.id as string,
      product_id: v.product_id as string,
      name: v.name as string,
      sku: (v.sku as string | null) ?? null,
      sort_order: Number(v.sort_order),
      is_active: Boolean(v.is_active),
      marketStock,
    };
  });
}

export type CatalogVersion = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  currency: string;
  available_stock: number;
  images: VersionImageRow[];
};

export async function getProductVersionsForMarket(productId: string, marketCode: string): Promise<CatalogVersion[]> {
  const supabase = await createSupabaseServerClient();
  const code = marketCode.toUpperCase();

  const { data: rows, error } = await supabase
    .from("product_versions_market_availability")
    .select(
      "version_id, product_id, version_name, sku, price, currency, available_stock, version_active, market_stock_active",
    )
    .eq("product_id", productId)
    .eq("market_code", code)
    .eq("version_active", true)
    .eq("market_stock_active", true)
    .order("version_sort_order");

  if (error || !rows?.length) return [];

  const versionIds = rows.map((r) => r.version_id as string);
  const { data: images } = await supabase
    .from("product_version_images")
    .select("id, version_id, storage_path, alt_text, sort_order, is_primary")
    .in("version_id", versionIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  const imagesByVersion = new Map<string, VersionImageRow[]>();
  for (const row of images ?? []) {
    const vid = row.version_id as string;
    const list = imagesByVersion.get(vid) ?? [];
    list.push({
      id: row.id as string,
      version_id: vid,
      url: publicStorageUrl("product-images", row.storage_path as string),
      alt_text: (row.alt_text as string | null) ?? null,
      sort_order: Number(row.sort_order),
      is_primary: Boolean(row.is_primary),
    });
    imagesByVersion.set(vid, list);
  }

  return rows.map((r) => ({
    id: r.version_id as string,
    product_id: r.product_id as string,
    name: r.version_name as string,
    sku: (r.sku as string | null) ?? null,
    price: Number(r.price),
    currency: String(r.currency).trim(),
    available_stock: Number(r.available_stock),
    images: imagesByVersion.get(r.version_id as string) ?? [],
  }));
}
