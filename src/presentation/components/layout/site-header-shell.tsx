"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { AuthNavLinks } from "@/presentation/components/layout/auth-nav-links";
import { CartNavLink } from "@/presentation/components/layout/cart-nav-link";
import { SiteMarketSelector } from "@/presentation/components/layout/site-market-selector";
import { MksDrawer } from "@/presentation/components/ui/mks-drawer";
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

function DrawerNavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block rounded-lg border-2 border-transparent px-3 py-2.5 text-sm font-bold text-[var(--mks-ink)] transition hover:border-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
    >
      {label}
    </Link>
  );
}

export function SiteHeaderShell({ markets, currentMarketCode, exploreNav }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 lg:h-[4.5rem]">
        <Link href="/" className="relative flex shrink-0 items-center py-1" onClick={close}>
          <Image
            src={brandAssets.logoHeader}
            alt="My Korea Store"
            width={200}
            height={56}
            className="h-8 w-auto lg:h-11"
            priority
          />
        </Link>

        {/* Desktop nav */}
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

        {/* Mobile / tablet bar */}
        <div className="flex items-center gap-1 lg:hidden">
          <div className="hidden min-[480px]:block">
            <SiteMarketSelector markets={markets} currentCode={currentMarketCode} compact />
          </div>
          <CartNavLink />
          <button
            type="button"
            className="min-h-11 rounded-lg border-2 border-[var(--mks-ink)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav-drawer"
          >
            {open ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      <MksDrawer
        open={open}
        onClose={close}
        id="site-nav-drawer"
        title="Navegación"
        side="left"
        footer={
          <>
            <AuthNavLinks layout="drawer" onNavigate={close} />
            <Link
              href="/carrito"
              onClick={close}
              className="block w-full rounded-xl border-4 border-[var(--mks-ink)] bg-white py-2.5 text-center text-sm font-black text-[var(--mks-ink)]"
            >
              Ver carrito
            </Link>
          </>
        }
      >
        <div className="min-[480px]:hidden">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-600">
            Mercado
          </p>
          <SiteMarketSelector markets={markets} currentCode={currentMarketCode} layout="stacked" />
        </div>

        <div className="mt-6 border-t-2 border-[var(--mks-ink)]/10 pt-6 [&_button]:w-full [&_button]:justify-center [&_button]:rounded-xl [&_button]:border-4 [&_button]:border-[var(--mks-ink)] [&_button]:px-4 [&_button]:py-3 [&_button]:text-sm [&_button]:font-black">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-600">
            Explorar
          </p>
          <div onClick={close}>{exploreNav}</div>
        </div>

        <nav className="mt-6 space-y-1 border-t-2 border-[var(--mks-ink)]/10 pt-6">
          {NAV_LINKS.map((link) => (
            <DrawerNavLink key={link.href} {...link} onNavigate={close} />
          ))}
        </nav>
      </MksDrawer>
    </header>
  );
}
