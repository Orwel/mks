import { Suspense } from "react";

import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { CatalogExploreNav } from "@/presentation/components/layout/catalog-explore-nav";
import { SiteHeaderShell } from "@/presentation/components/layout/site-header-shell";

type Props = {
  markets?: MarketRow[];
  currentMarketCode?: string | null;
};

function ExploreNavFallback() {
  return (
    <span className="inline-block h-8 w-20 animate-pulse rounded-lg bg-[var(--mks-ink)]/10" aria-hidden />
  );
}

export function SiteHeader({ markets = [], currentMarketCode = null }: Props) {
  return (
    <SiteHeaderShell
      markets={markets}
      currentMarketCode={currentMarketCode}
      exploreNav={
        <Suspense fallback={<ExploreNavFallback />}>
          <CatalogExploreNav />
        </Suspense>
      }
    />
  );
}
