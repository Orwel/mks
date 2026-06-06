import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getProductBySlugCached,
  getRelatedProductsCached,
} from "@/infrastructure/supabase/queries/catalog";
import { ProductDetailView } from "@/presentation/components/catalog/product-detail-view";
import {
  enrichProductWithDisplayPrice,
  enrichProductsWithDisplayPrice,
  resolveMarketPricingContext,
} from "@/shared/lib/money/resolve-market-pricing";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugCached(slug);
  if (!product) {
    return { title: "Producto no encontrado" };
  }
  return {
    title: product.name,
    description: product.description ?? `Compra ${product.name} en My Korea Store.`,
  };
}

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlugCached(slug);
  if (!product) notFound();

  const pricing = await resolveMarketPricingContext();
  const displayProduct = enrichProductWithDisplayPrice(pricing, product);
  const relatedRaw = product.category_slug
    ? await getRelatedProductsCached(product.category_slug, product.id)
    : [];
  const relatedProducts = enrichProductsWithDisplayPrice(pricing, relatedRaw);

  return <ProductDetailView product={displayProduct} relatedProducts={relatedProducts} />;
}
