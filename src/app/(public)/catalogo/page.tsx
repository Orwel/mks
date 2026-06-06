import { Suspense } from "react";

import { getCatalogPageDataCached } from "@/infrastructure/supabase/queries/catalog";
import { CatalogView } from "@/presentation/components/catalog/catalog-view";
import {
  enrichProductsWithDisplayPrice,
  resolveMarketPricingContext,
} from "@/shared/lib/money/resolve-market-pricing";

function CatalogViewFallback() {
  return (
    <div className="border-b-4 border-[var(--mks-ink)] bg-white px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-neutral-200" />
        <div className="h-4 w-full max-w-xl rounded bg-neutral-100" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl border-4 border-neutral-200 bg-neutral-50" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CatalogoPage() {
  const [data, pricing] = await Promise.all([
    getCatalogPageDataCached(),
    resolveMarketPricingContext(),
  ]);
  const products = enrichProductsWithDisplayPrice(pricing, data.products);

  return (
    <Suspense fallback={<CatalogViewFallback />}>
      <CatalogView {...data} products={products} />
    </Suspense>
  );
}


