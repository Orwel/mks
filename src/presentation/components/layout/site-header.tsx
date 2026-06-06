import Image from "next/image";
import Link from "next/link";

import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { AuthNavLinks } from "@/presentation/components/layout/auth-nav-links";
import { CartNavLink } from "@/presentation/components/layout/cart-nav-link";
import { CatalogExploreNav } from "@/presentation/components/layout/catalog-explore-nav";
import { SiteMarketSelector } from "@/presentation/components/layout/site-market-selector";
import { brandAssets } from "@/shared/constants/brand";

type Props = {
  markets?: MarketRow[];
  currentMarketCode?: string | null;
};

export function SiteHeader({ markets = [], currentMarketCode = null }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-[4.5rem]">
        <Link href="/" className="relative flex shrink-0 items-center py-2">
          <Image
            src={brandAssets.logoHeader}
            alt="My Korea Store"
            width={200}
            height={56}
            className="h-9 w-auto md:h-11"
            priority
          />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-bold sm:gap-2 md:gap-4">
          <SiteMarketSelector markets={markets} currentCode={currentMarketCode} />
          <CatalogExploreNav />
          <Link
            href="/nosotros"
            className="rounded-lg px-2 py-1 text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40 md:px-3"
          >
            Nosotros
          </Link>
          <Link
            href="/contactanos"
            className="rounded-lg px-2 py-1 text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40 md:px-3"
          >
            Contáctanos
          </Link>
          <Link
            href="/catalogo"
            className="rounded-lg px-2 py-1 text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40 md:px-3"
          >
            Catálogo
          </Link>
          <CartNavLink />
          <AuthNavLinks />
        </nav>
      </div>
    </header>
  );
}
