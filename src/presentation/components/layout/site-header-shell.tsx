"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { AuthNavLinks } from "@/presentation/components/layout/auth-nav-links";
import { CartNavLink } from "@/presentation/components/layout/cart-nav-link";
import { SiteMarketSelector } from "@/presentation/components/layout/site-market-selector";
import { brandAssets } from "@/shared/constants/brand";

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contactanos", label: "Contáctanos" },
] as const;

type Props = {
  markets: MarketRow[];
  currentMarketCode: string | null;
  exploreNav: ReactNode;
};

function currentMarketLabel(markets: MarketRow[], code: string | null) {
  if (!code) return "Selecciona tu mercado";
  const market = markets.find((m) => m.code === code);
  if (!market) return code;
  return `${market.flag_emoji ? `${market.flag_emoji} ` : ""}${market.name}`;
}

export function SiteHeaderShell({ markets, currentMarketCode, exploreNav }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]/95 backdrop-blur-md pt-safe">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 lg:h-[4.5rem]">
        <Link href="/" className="relative flex shrink-0 items-center py-1 lg:py-2">
          <Image
            src={brandAssets.logoHeader}
            alt="My Korea Store"
            width={200}
            height={56}
            className="h-8 w-auto object-contain object-left lg:h-11"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-bold lg:flex lg:gap-4">
          <SiteMarketSelector markets={markets} currentCode={currentMarketCode} />
          {exploreNav}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
            >
              {link.label}
            </Link>
          ))}
          <CartNavLink />
          <AuthNavLinks />
        </nav>
      </div>

      {/* Mobile search strip — app-like quick access */}
      <div className="border-t-2 border-[var(--mks-ink)]/10 bg-white px-4 py-2.5 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Link
            href="/catalogo"
            className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] px-3 py-2 text-sm font-medium text-neutral-600 shadow-[3px_3px_0_0_var(--mks-cyan)] transition active:translate-y-0.5 active:shadow-none"
          >
            <Search className="h-4 w-4 shrink-0 text-[var(--mks-pink)]" strokeWidth={2.5} aria-hidden />
            <span>¿Qué quieres buscar?</span>
          </Link>
          <div className="shrink-0">
            <SiteMarketSelector
              markets={markets}
              currentCode={currentMarketCode}
              compact
            />
          </div>
        </div>
        {markets.length > 0 ? (
          <p className="mx-auto mt-2 max-w-6xl truncate text-[0.6875rem] font-bold uppercase tracking-wide text-neutral-500">
            Entregas · {currentMarketLabel(markets, currentMarketCode)}
          </p>
        ) : null}
      </div>
    </header>
  );
}
