"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/presentation/components/auth/sign-out-button";
import { brandAssets } from "@/shared/constants/brand";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/productos", label: "Productos" },
  { href: "/categorias", label: "Categorías" },
  { href: "/mercados", label: "Mercados" },
  { href: "/apariencia", label: "Apariencia" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/destacados", label: "Destacados" },
  { href: "/ticker", label: "Ticker" },
  { href: "/anuncios", label: "Anuncios pop-up" },
  { href: "/legal", label: "Legal" },
] as const;

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border-2 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
        active
          ? "border-[var(--mks-cyan)] bg-[var(--mks-cyan)]/15 text-[var(--mks-cyan)]"
          : "border-transparent text-white/90 hover:border-[var(--mks-cyan)] hover:text-[var(--mks-cyan)]",
      )}
    >
      {label}
    </Link>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b-4 border-[var(--mks-ink)] bg-[var(--mks-ink)] px-4 py-3 text-white md:hidden">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="relative block h-8 w-[9.5rem] shrink-0">
            <Image
              src={brandAssets.logoFooter}
              alt="My Korea Store"
              fill
              className="object-contain object-left"
              sizes="152px"
              priority
            />
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border-2 border-white/30 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? "Cerrar" : "Menú"}
          </button>
          <SignOutButton variant="solid" />
        </div>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r-4 border-[var(--mks-ink)] bg-[var(--mks-ink)] text-white transition-transform duration-200 md:relative md:inset-auto md:z-0 md:min-h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
          <div className="mb-6 hidden border-b-2 border-white/10 pb-6 md:block">
            <Link
              href="/dashboard"
              className="flex w-max max-w-full flex-col items-start gap-2"
              onClick={() => setOpen(false)}
            >
              <span className="relative block h-11 w-[min(100%,13.5rem)] shrink-0">
                <Image
                  src={brandAssets.logoFooter}
                  alt="My Korea Store"
                  fill
                  className="object-contain object-left"
                  sizes="216px"
                  priority
                />
              </span>
              <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[var(--mks-cyan)]">
                Panel administración
              </span>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {LINKS.map((l) => (
              <span key={l.href} onClick={() => setOpen(false)}>
                <NavLink href={l.href} label={l.label} />
              </span>
            ))}
            <span onClick={() => setOpen(false)}>
              <Link
                href="/usuarios"
                className="mt-2 block rounded-lg border-2 border-[var(--mks-pink)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--mks-pink)] hover:bg-[var(--mks-pink)]/10"
              >
                Usuarios
              </Link>
            </span>
          </nav>

          <div className="mt-6 space-y-2 border-t-2 border-white/10 pt-6">
            <Link
              href="/"
              className="block rounded-lg px-3 py-2 text-xs font-bold text-white/70 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Ver tienda
            </Link>
            <div className="hidden md:block">
              <SignOutButton variant="solid" className="w-full justify-center" />
            </div>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
