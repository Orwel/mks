import { getCatalogCurrencies } from "@/infrastructure/supabase/queries/markets";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { ProductImageAdminRow } from "@/presentation/components/dashboard/product-images-panel";
import { ProductsAdmin, type ProductAdminRow } from "@/presentation/components/dashboard/products-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";
import { publicStorageUrl } from "@/shared/lib/public-storage-url";

type CategoryRow = { id: string; name: string };
type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string;
  price: number;
  currency: string;
  stock: number;
  sku: string | null;
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

export default async function DashboardProductosPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: categories, error: catErr }, { data: products, error: prodErr }, imagesRes, currencies] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, parent_id")
        .not("parent_id", "is", null)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select(
          "id, slug, name, description, category_id, price, currency, stock, sku, is_featured, is_active, categories(id, name)",
        )
        .not("slug", "like", "borrador-%")
        .order("name"),
      supabase
        .from("product_images")
        .select("id, product_id, storage_path, alt_text, sort_order, is_primary")
        .order("product_id", { ascending: true })
        .order("sort_order", { ascending: true }),
      getCatalogCurrencies(),
    ]);

  const imagesErr = imagesRes.error;

  const cats = (categories ?? []) as CategoryRow[];
  const raw = (products ?? []) as unknown as ProductRow[];
  const prods: ProductAdminRow[] = raw.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category_id: p.category_id,
    price: p.price,
    currency: String(p.currency ?? "COP").trim(),
    stock: p.stock,
    sku: p.sku,
    is_featured: p.is_featured,
    is_active: p.is_active,
    categoryName: categoryName(p),
  }));

  const imagesByProduct: Record<string, ProductImageAdminRow[]> = {};
  for (const row of imagesRes.data ?? []) {
    const productId = row.product_id as string;
    const list = imagesByProduct[productId] ?? [];
    list.push({
      id: row.id as string,
      product_id: productId,
      url: publicStorageUrl("product-images", row.storage_path as string),
      alt_text: (row.alt_text as string | null) ?? null,
      sort_order: Number(row.sort_order),
      is_primary: Boolean(row.is_primary),
    });
    imagesByProduct[productId] = list;
  }

  const currencyOptions = currencies.map((c) => ({ code: c.code.trim(), name: c.name }));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Productos"
        description="Alta y edición de catálogo. Las imágenes se guardan en Supabase Storage (bucket product-images) y se muestran en la galería del producto."
      />

      {catErr ? <p className="text-sm font-bold text-[var(--mks-pink)]">{catErr.message}</p> : null}
      {prodErr ? <p className="text-sm font-bold text-[var(--mks-pink)]">{prodErr.message}</p> : null}
      {imagesErr ? (
        <p className="text-sm font-bold text-[var(--mks-pink)]">{imagesErr.message}</p>
      ) : null}

      <ProductsAdmin
        products={prods}
        categories={cats}
        currencies={currencyOptions}
        imagesByProduct={imagesByProduct}
      />
    </div>
  );
}
