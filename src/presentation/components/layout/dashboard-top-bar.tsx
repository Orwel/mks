import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/presentation/components/auth/sign-out-button";
import { brandAssets } from "@/shared/constants/brand";

const LINKS = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/productos", label: "Productos" },
  { href: "/categorias", label: "Categorías" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/banners", label: "Banners" },
  { href: "/ticker", label: "Ticker" },
  { href: "/anuncios", label: "Anuncios" },
  { href: "/legal", label: "Legal" },
] as const;

export function DashboardTopBar({ showUsersLink }: { showUsersLink: boolean }) {
  return (
    <header className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-ink)] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src={brandAssets.logoFooter}
              alt="My Korea Store"
              width={170}
              height={48}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <SignOutButton variant="solid" className="md:hidden" />
        </div>
        <nav className="flex flex-wrap items-center gap-2 md:justify-end">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg border-2 border-transparent px-2 py-1 text-xs font-bold uppercase tracking-wide text-white/90 hover:border-[var(--mks-cyan)] hover:text-[var(--mks-cyan)] md:text-[0.7rem]"
            >
              {l.label}
            </Link>
          ))}
          {showUsersLink && (
            <Link
              href="/usuarios"
              className="rounded-lg border-2 border-[var(--mks-pink)] px-2 py-1 text-xs font-black uppercase tracking-wide text-[var(--mks-pink)] md:text-[0.7rem]"
            >
              Usuarios
            </Link>
          )}
          <Link
            href="/"
            className="ml-1 rounded-lg px-2 py-1 text-xs font-bold text-white/70 hover:text-white"
          >
            Ver tienda
          </Link>
          <SignOutButton variant="solid" className="hidden md:inline-flex" />
        </nav>
      </div>
    </header>
  );
}
