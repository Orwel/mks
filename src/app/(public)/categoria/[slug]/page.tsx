import { notFound } from "next/navigation";

import { getCatalogPageDataCached } from "@/infrastructure/supabase/queries/catalog";
import { CategoryProductsView } from "@/presentation/components/catalog/category-products-view";

type Props = { params: Promise<{ slug: string }> };

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const { categories, products } = await getCatalogPageDataCached();

  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    notFound();
  }

  const categoryProducts = products.filter((p) => p.category_slug === slug);

  return (
    <CategoryProductsView
      category={category}
      products={categoryProducts}
      allCategories={categories}
    />
  );
}
