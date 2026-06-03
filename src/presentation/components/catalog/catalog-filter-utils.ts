import type { CatalogProduct, MetadataFacet } from "@/infrastructure/supabase/queries/catalog";

export type CatalogSort =
  | "name_asc"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "stock_desc";

export type StockFilter = "all" | "in_stock" | "out_of_stock";

export type CatalogFiltersState = {
  q: string;
  categoria: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  stock: StockFilter;
  destacados: boolean;
  sort: CatalogSort;
  metadata: Record<string, string>;
};

export function parseCatalogSearchParams(params: URLSearchParams): CatalogFiltersState {
  const minRaw = params.get("min");
  const maxRaw = params.get("max");
  const minPrice = minRaw ? Number(minRaw) : null;
  const maxPrice = maxRaw ? Number(maxRaw) : null;

  const metadata: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith("attr_") && value) {
      metadata[key.slice(5)] = value;
    }
  }

  const sortParam = params.get("orden");
  const sort: CatalogSort =
    sortParam === "price_asc" ||
    sortParam === "price_desc" ||
    sortParam === "newest" ||
    sortParam === "stock_desc"
      ? sortParam
      : "name_asc";

  const stockParam = params.get("stock");
  const stock: StockFilter =
    stockParam === "in_stock" || stockParam === "out_of_stock" ? stockParam : "all";

  return {
    q: params.get("q")?.trim() ?? "",
    categoria: params.get("categoria") || null,
    minPrice: minPrice !== null && !Number.isNaN(minPrice) ? minPrice : null,
    maxPrice: maxPrice !== null && !Number.isNaN(maxPrice) ? maxPrice : null,
    stock,
    destacados: params.get("destacados") === "1",
    sort,
    metadata,
  };
}

export function catalogFiltersToSearchParams(filters: CatalogFiltersState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.minPrice !== null) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("max", String(filters.maxPrice));
  if (filters.stock !== "all") params.set("stock", filters.stock);
  if (filters.destacados) params.set("destacados", "1");
  if (filters.sort !== "name_asc") params.set("orden", filters.sort);

  for (const [key, value] of Object.entries(filters.metadata)) {
    if (value) params.set(`attr_${key}`, value);
  }

  return params;
}

function metadataMatches(product: CatalogProduct, metadata: Record<string, string>): boolean {
  for (const [key, filterValue] of Object.entries(metadata)) {
    const raw = product.metadata[key];
    if (raw === null || raw === undefined) return false;
    if (typeof raw === "boolean") {
      const expected = filterValue === "true";
      if (raw !== expected) return false;
      continue;
    }
    if (String(raw) !== filterValue) return false;
  }
  return true;
}

export function filterCatalogProducts(
  products: CatalogProduct[],
  filters: CatalogFiltersState,
): CatalogProduct[] {
  const q = filters.q.toLowerCase();

  let result = products.filter((p) => {
    if (filters.categoria && p.category_slug !== filters.categoria) return false;

    if (filters.destacados && !p.is_featured) return false;

    if (filters.stock === "in_stock" && p.available_stock < 1) return false;
    if (filters.stock === "out_of_stock" && p.available_stock > 0) return false;

    if (filters.minPrice !== null && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;

    if (!metadataMatches(p, filters.metadata)) return false;

    if (q) {
      const haystack = [p.name, p.description ?? "", p.sku ?? "", p.category_name]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "newest":
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case "stock_desc":
        return b.available_stock - a.available_stock;
      default:
        return a.name.localeCompare(b.name, "es");
    }
  });

  return result;
}

export function countActiveFilters(filters: CatalogFiltersState): number {
  let n = 0;
  if (filters.q) n += 1;
  if (filters.categoria) n += 1;
  if (filters.minPrice !== null || filters.maxPrice !== null) n += 1;
  if (filters.stock !== "all") n += 1;
  if (filters.destacados) n += 1;
  n += Object.keys(filters.metadata).length;
  return n;
}

export function defaultCatalogFilters(): CatalogFiltersState {
  return {
    q: "",
    categoria: null,
    minPrice: null,
    maxPrice: null,
    stock: "all",
    destacados: false,
    sort: "name_asc",
    metadata: {},
  };
}
