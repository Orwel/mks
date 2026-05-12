import Image from "next/image";
import Link from "next/link";

import { brandAssets } from "@/shared/constants/brand";
import { siteConfig } from "@/shared/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-4 border-[var(--mks-ink)] bg-[var(--mks-ink)] px-6 py-14 text-sm text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between md:gap-12">
        <div className="space-y-4">
          <Image
            src={brandAssets.logoFooter}
            alt="My Korea Store"
            width={220}
            height={62}
            className="h-10 w-auto"
          />
          <p className="max-w-sm text-white/90">{siteConfig.description}</p>
        </div>
        <nav className="flex flex-col gap-3 md:items-end">
          <Link href="/terminos" className="font-bold text-[var(--mks-cyan)] hover:underline">
            Términos y condiciones
          </Link>
          <Link href="/privacidad" className="font-bold text-[var(--mks-cyan)] hover:underline">
            Política de privacidad
          </Link>
          <Link href="/login?next=/dashboard" className="font-bold text-[var(--mks-pink)] hover:underline">
            Acceso empleados
          </Link>
          <Link href="/catalogo" className="text-white/90 hover:text-white">
            Catálogo
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-white/60 md:text-left">
        © {new Date().getFullYear()} {siteConfig.name}. Colombia.
      </p>
    </footer>
  );
}
