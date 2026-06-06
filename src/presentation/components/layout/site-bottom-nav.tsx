"use client";

import {
  Home,
  LayoutGrid,
  Menu,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/utils";
import { useSiteMobileNavOptional } from "@/presentation/components/layout/site-mobile-nav-context";
import { useCartStore } from "@/presentation/stores/cart-store";
import { isBrowserSupabaseConfigured } from "@/shared/config/env";

function cartItemCount(lines: { quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

type NavItem =
  | {
      kind: "link";
      href: string;
      label: string;
      icon: typeof Home;
      match: (path: string) => boolean;
      badge?: number;
    }
  | {
      kind: "menu";
      label: string;
      icon: typeof Menu;
    };

function NavIconButton({
  active,
  label,
  icon: Icon,
  badge,
  onClick,
  href,
}: {
  active: boolean;
  label: string;
  icon: typeof Home;
  badge?: number;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl border-2 transition",
          active
            ? "border-[var(--mks-ink)] bg-[var(--mks-cyan)] text-[var(--mks-ink)] shadow-[2px_2px_0_0_var(--mks-ink)]"
            : "border-transparent text-neutral-600",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        {badge && badge > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-0.5 text-[0.5625rem] font-black leading-none text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "max-w-[4.5rem] truncate text-[0.625rem] font-black uppercase tracking-wide",
          active ? "text-[var(--mks-pink)]" : "text-neutral-500",
        )}
      >
        {label}
      </span>
    </>
  );

  const className =
    "flex min-h-[var(--mks-mobile-nav-inner)] flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition active:scale-95";

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-expanded={active}
      aria-label={label}
    >
      {content}
    </button>
  );
}

export function SiteBottomNav() {
  const pathname = usePathname();
  const mobileNav = useSiteMobileNavOptional();
  const lines = useCartStore((s) => s.lines);
  const cartCount = useMemo(() => cartItemCount(lines), [lines]);
  const [cartHydrated, setCartHydrated] = useState(() => useCartStore.persist.hasHydrated());
  const [authReady, setAuthReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (cartHydrated) return undefined;
    return useCartStore.persist.onFinishHydration(() => setCartHydrated(true));
  }, [cartHydrated]);

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) {
      queueMicrotask(() => {
        setAuthReady(true);
        setLoggedIn(false);
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const accountHref = loggedIn ? "/mi-cuenta" : "/login";
  const displayCartCount = cartHydrated ? cartCount : 0;
  const menuOpen = mobileNav?.menuOpen ?? false;

  const items: NavItem[] = [
    {
      kind: "link",
      href: "/",
      label: "Inicio",
      icon: Home,
      match: (p) => p === "/",
    },
    {
      kind: "link",
      href: "/catalogo",
      label: "Catálogo",
      icon: LayoutGrid,
      match: (p) =>
        p === "/catalogo" || p.startsWith("/catalogo/") || p.startsWith("/categoria/"),
    },
    {
      kind: "link",
      href: "/carrito",
      label: "Carrito",
      icon: ShoppingCart,
      match: (p) => p === "/carrito" || p === "/checkout",
      badge: displayCartCount,
    },
    {
      kind: "link",
      href: accountHref,
      label: authReady ? (loggedIn ? "Cuenta" : "Entrar") : "Cuenta",
      icon: UserRound,
      match: (p) =>
        p === "/mi-cuenta" ||
        p.startsWith("/mis-pedidos") ||
        p === "/login" ||
        p === "/registro",
    },
    {
      kind: "menu",
      label: "Más",
      icon: Menu,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]/98 backdrop-blur-md lg:hidden"
      aria-label="Navegación principal"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          if (item.kind === "menu") {
            const active = menuOpen;
            return (
              <li key="menu">
                <NavIconButton
                  active={active}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => mobileNav?.toggleMenu()}
                />
              </li>
            );
          }

          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <NavIconButton
                active={active}
                label={item.label}
                icon={item.icon}
                href={item.href}
                badge={item.badge}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
