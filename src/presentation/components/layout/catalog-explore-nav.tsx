import { Suspense } from "react";

import { getCatalogPageDataCached } from "@/infrastructure/supabase/queries/catalog";
import { CatalogBrowseDrawer } from "@/presentation/components/catalog/catalog-browse-drawer";

function ExploreButtonFallback() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 opacity-60 md:gap-2 md:px-3"
      aria-hidden
    >
      <span className="h-5 w-5 rounded bg-[var(--mks-ink)]/10" />
      <span className="hidden h-4 w-16 rounded bg-[var(--mks-ink)]/10 sm:inline" />
    </span>
  );
}

async function CatalogExploreNavInner() {
  const { categories, products } = await getCatalogPageDataCached();

  return (
    <CatalogBrowseDrawer categories={categories} totalProducts={products.length} />
  );
}

export function CatalogExploreNav() {
  return (
    <Suspense fallback={<ExploreButtonFallback />}>
      <CatalogExploreNavInner />
    </Suspense>
  );
}
