import { Suspense } from "react";

import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { CatalogExploreNav } from "@/presentation/components/layout/catalog-explore-nav";
import { SiteBottomNav } from "@/presentation/components/layout/site-bottom-nav";
import { SiteHeaderShell } from "@/presentation/components/layout/site-header-shell";
import { SiteMobileMoreMenu } from "@/presentation/components/layout/site-mobile-more-menu";
import { SiteMobileNavProvider } from "@/presentation/components/layout/site-mobile-nav-context";
import { SiteMobileNavRouteSync } from "@/presentation/components/layout/site-mobile-nav-route-sync";

type Props = {
  markets?: MarketRow[];
  currentMarketCode?: string | null;
  accountLinks?: readonly { href: string; label: string }[];
  showAdminLink?: boolean;
  /** Oculta la barra inferior (p. ej. auth fullscreen). */
  hideBottomNav?: boolean;
};

function ExploreNavFallback() {
  return (
    <span className="inline-block h-11 w-full animate-pulse rounded-xl bg-[var(--mks-ink)]/10" aria-hidden />
  );
}

function ExploreNavWithSuspense() {
  return (
    <Suspense fallback={<ExploreNavFallback />}>
      <CatalogExploreNav />
    </Suspense>
  );
}

export function SiteHeader({
  markets = [],
  currentMarketCode = null,
  accountLinks,
  showAdminLink = false,
  hideBottomNav = false,
}: Props) {
  const exploreNav = <ExploreNavWithSuspense />;

  return (
    <SiteMobileNavProvider>
      <SiteMobileNavRouteSync />
      <SiteHeaderShell
        markets={markets}
        currentMarketCode={currentMarketCode}
        exploreNav={exploreNav}
        showAdminLink={showAdminLink}
      />
      <SiteMobileMoreMenu
        markets={markets}
        currentMarketCode={currentMarketCode}
        accountLinks={accountLinks}
        showAdminLink={showAdminLink}
      />
      {hideBottomNav ? null : <SiteBottomNav />}
    </SiteMobileNavProvider>
  );
}
