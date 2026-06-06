"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { AuthNavLinks } from "@/presentation/components/layout/auth-nav-links";
import { SiteMarketSelector } from "@/presentation/components/layout/site-market-selector";
import { useSiteMobileNav } from "@/presentation/components/layout/site-mobile-nav-context";
import { MksDrawer } from "@/presentation/components/ui/mks-drawer";
import { mksButtonClass } from "@/presentation/components/ui/mks-button";

const STORE_LINKS = [
  { href: "/catalogo", label: "Catálogo completo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contactanos", label: "Contáctanos" },
] as const;

const LEGAL_LINKS = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
] as const;

type Props = {
  markets: MarketRow[];
  currentMarketCode: string | null;
  exploreNav: ReactNode;
  accountLinks?: readonly { href: string; label: string }[];
  showAdminLink?: boolean;
};

function DrawerLink({
  href,
  label,
  onNavigate,
  accent,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={
        accent
          ? mksButtonClass({ variant: "accent", size: "md", className: "w-full" })
          : "block rounded-xl border-2 border-transparent px-3 py-2.5 text-sm font-bold text-[var(--mks-ink)] transition hover:border-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
      }
    >
      {label}
    </Link>
  );
}

export function SiteMobileMenuDrawer({
  markets,
  currentMarketCode,
  exploreNav,
  accountLinks,
  showAdminLink = false,
}: Props) {
  const { menuOpen, closeMenu } = useSiteMobileNav();

  return (
    <MksDrawer
      open={menuOpen}
      onClose={closeMenu}
      id="site-mobile-menu"
      title="Menú"
      eyebrow="My Korea Store"
      side="left"
      footer={
        <div className="space-y-2">
          <AuthNavLinks layout="drawer" onNavigate={closeMenu} />
          <Link
            href="/carrito"
            onClick={closeMenu}
            className={mksButtonClass({ variant: "outline", size: "md", className: "w-full" })}
          >
            Ver carrito
          </Link>
        </div>
      }
    >
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--mks-pink)]">
          Tu mercado
        </p>
        <SiteMarketSelector
          markets={markets}
          currentCode={currentMarketCode}
          layout="stacked"
        />
      </div>

      {accountLinks && accountLinks.length > 0 ? (
        <nav className="mt-6 space-y-1 border-t-2 border-[var(--mks-ink)]/10 pt-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
            Tu cuenta
          </p>
          {showAdminLink ? (
            <DrawerLink href="/dashboard" label="Panel admin" onNavigate={closeMenu} accent />
          ) : null}
          {accountLinks.map((link) => (
            <DrawerLink key={link.href} {...link} onNavigate={closeMenu} />
          ))}
        </nav>
      ) : null}

      <div className="mt-6 border-t-2 border-[var(--mks-ink)]/10 pt-6 [&_button]:w-full [&_button]:justify-center [&_button]:rounded-xl [&_button]:border-4 [&_button]:border-[var(--mks-ink)] [&_button]:px-4 [&_button]:py-3 [&_button]:text-sm [&_button]:font-black">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--mks-cyan)]">
          Explorar productos
        </p>
        <div onClick={closeMenu}>{exploreNav}</div>
      </div>

      <nav className="mt-6 space-y-1 border-t-2 border-[var(--mks-ink)]/10 pt-6">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
          Tienda
        </p>
        {STORE_LINKS.map((link) => (
          <DrawerLink key={link.href} {...link} onNavigate={closeMenu} />
        ))}
      </nav>

      <nav className="mt-6 space-y-1 border-t-2 border-[var(--mks-ink)]/10 pt-6">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
          Legal
        </p>
        {LEGAL_LINKS.map((link) => (
          <DrawerLink key={link.href} {...link} onNavigate={closeMenu} />
        ))}
        <Link
          href="/login?next=/dashboard"
          onClick={closeMenu}
          className="mt-2 block px-3 py-2 text-xs font-bold text-[var(--mks-pink)] hover:underline"
        >
          Acceso empleados
        </Link>
      </nav>
    </MksDrawer>
  );
}
