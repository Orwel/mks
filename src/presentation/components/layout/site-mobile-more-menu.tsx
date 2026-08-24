"use client";

import {
  FileText,
  Globe,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  Package,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/utils";
import { useSiteMobileNav } from "@/presentation/components/layout/site-mobile-nav-context";
import { SiteMarketSelector } from "@/presentation/components/layout/site-market-selector";
import { useHydrated } from "@/presentation/lib/use-hydrated";
import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { isBrowserSupabaseConfigured } from "@/shared/config/env";

const STORE_LINKS = [
  { href: "/catalogo", label: "Catálogo", icon: LayoutGrid },
  { href: "/catalogo", label: "Explorar productos", icon: SlidersHorizontal },
  { href: "/nosotros", label: "Nosotros", icon: UserRound },
  { href: "/contactanos", label: "Contáctanos", icon: Mail },
] as const;

const LEGAL_LINKS = [
  { href: "/terminos", label: "Términos y condiciones", icon: FileText },
  { href: "/privacidad", label: "Política de privacidad", icon: Shield },
] as const;

type Props = {
  markets: MarketRow[];
  currentMarketCode: string | null;
  accountLinks?: readonly { href: string; label: string }[];
  showAdminLink?: boolean;
};

function MenuDivider() {
  return <div className="my-1 border-t border-neutral-200" role="separator" />;
}

function MenuLink({
  href,
  label,
  icon: Icon,
  onNavigate,
  accent,
  danger,
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  onNavigate: () => void;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition",
        danger
          ? "text-[var(--mks-pink)] hover:bg-[var(--mks-pink)]/10"
          : accent
            ? "bg-[var(--mks-pink)]/10 text-[var(--mks-pink)] hover:bg-[var(--mks-pink)]/20"
            : "text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/30",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2.25} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

function SignOutMenuItem({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    onDone();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={loading}
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--mks-pink)] transition hover:bg-[var(--mks-pink)]/10 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}

export function SiteMobileMoreMenu({
  markets,
  currentMarketCode,
  accountLinks,
  showAdminLink = false,
}: Props) {
  const { menuOpen, closeMenu } = useSiteMobileNav();
  const mounted = useHydrated();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  const onNavigate = useCallback(() => closeMenu(), [closeMenu]);

  if (!mounted || !menuOpen) return null;

  const accountItems =
    accountLinks && accountLinks.length > 0
      ? accountLinks.map((link) => ({
          ...link,
          icon: link.href.includes("pedidos") ? Package : UserRound,
        }))
      : loggedIn
        ? [
            { href: "/mi-cuenta", label: "Mi cuenta", icon: UserRound },
            { href: "/mis-pedidos", label: "Mis pedidos", icon: Package },
          ]
        : [];

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        className="fixed inset-0 z-[55] bg-[var(--mks-ink)]/15 lg:hidden"
        onClick={closeMenu}
      />
      <div
        id="site-mobile-more-menu"
        role="menu"
        aria-label="Más opciones"
        className="fixed right-3 z-[60] w-[min(calc(100vw-1.5rem),17.5rem)] overflow-hidden rounded-2xl border-4 border-[var(--mks-ink)] bg-white shadow-[6px_6px_0_0_var(--mks-cyan)] lg:hidden"
        style={{ bottom: "calc(var(--mks-mobile-nav-h) + 0.625rem)" }}
      >
        <div className="max-h-[min(70vh,26rem)] overflow-y-auto p-2">
          {showAdminLink ? (
            <>
              <MenuLink
                href="/dashboard"
                label="Panel admin"
                icon={LayoutDashboard}
                onNavigate={onNavigate}
                accent
              />
              <MenuDivider />
            </>
          ) : null}

          {accountItems.length > 0 ? (
            <>
              {accountItems.map((item) => (
                <MenuLink key={item.href} {...item} onNavigate={onNavigate} />
              ))}
              <MenuDivider />
            </>
          ) : null}

          {markets.length > 0 ? (
            <>
              <div className="px-3 py-2">
                <p className="mb-1.5 flex items-center gap-2 text-[0.625rem] font-black uppercase tracking-[0.15em] text-neutral-500">
                  <Globe className="h-3.5 w-3.5" aria-hidden />
                  Mercado
                </p>
                <SiteMarketSelector
                  markets={markets}
                  currentCode={currentMarketCode}
                  layout="stacked"
                />
              </div>
              <MenuDivider />
            </>
          ) : null}

          {STORE_LINKS.map((link) => (
            <MenuLink key={`${link.href}-${link.label}`} {...link} onNavigate={onNavigate} />
          ))}

          <MenuDivider />

          {LEGAL_LINKS.map((link) => (
            <MenuLink key={link.href} {...link} onNavigate={onNavigate} />
          ))}

          <Link
            href="/login?next=/dashboard"
            role="menuitem"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-500 transition hover:bg-neutral-100"
          >
            Acceso empleados
          </Link>

          {loggedIn ? (
            <>
              <MenuDivider />
              <SignOutMenuItem onDone={onNavigate} />
            </>
          ) : (
            <>
              <MenuDivider />
              <MenuLink
                href="/login"
                label="Iniciar sesión"
                icon={UserRound}
                onNavigate={onNavigate}
              />
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
