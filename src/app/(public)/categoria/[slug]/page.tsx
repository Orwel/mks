import { notFound } from "next/navigation";

import { getCatalogPageDataCached } from "@/infrastructure/supabase/queries/catalog";
import { CategoryProductsView } from "@/presentation/components/catalog/category-products-view";
import {
  enrichProductsWithDisplayPrice,
  resolveMarketPricingContext,
} from "@/shared/lib/money/resolve-market-pricing";

type Props = { params: Promise<{ slug: string }> };

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const [{ categories, subcategories, products }, pricing] = await Promise.all([
    getCatalogPageDataCached(),
    resolveMarketPricingContext(),
  ]);

  const sub = subcategories.find((s) => s.slug === slug);
  const root = categories.find((c) => c.slug === slug);

  if (!sub && !root) {
    notFound();
  }

  const categoryProducts = enrichProductsWithDisplayPrice(
    pricing,
    products.filter((p) =>
      sub ? p.category_slug === slug : p.parent_category_slug === slug,
    ),
  );

  const viewCategory = sub ?? root!;

  return (
    <CategoryProductsView
      category={viewCategory}
      isSubcategory={Boolean(sub)}
      parentCategory={sub ? categories.find((c) => c.slug === sub.parent_slug) ?? null : null}
      products={categoryProducts}
      roots={categories}
      subcategories={subcategories}
      activeRootSlug={sub?.parent_slug ?? root?.slug ?? null}
      activeSubSlug={sub?.slug ?? null}
    />
  );
}
