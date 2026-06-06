import Image from "next/image";
import Link from "next/link";

import type { SiteFooterSettings } from "@/infrastructure/supabase/queries/site-settings";
import { brandAssets } from "@/shared/constants/brand";
import { siteConfig } from "@/shared/config/site";

type Props = {
  settings?: SiteFooterSettings;
};

export function SiteFooter({ settings = {} }: Props) {
  const tagline = settings.tagline ?? siteConfig.description;
  const copyright = settings.copyright ?? siteConfig.name;
  const termsLabel = settings.terms_label ?? "Términos y condiciones";
  const privacyLabel = settings.privacy_label ?? "Política de privacidad";

  return (
    <footer className="mt-auto border-t-4 border-[var(--mks-ink)] bg-[var(--mks-ink)] px-6 py-10 text-sm text-white/80 lg:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between md:gap-12">
        <div className="space-y-4">
          <Image
            src={brandAssets.logoFooter}
            alt="My Korea Store"
            width={220}
            height={62}
            className="h-10 w-auto"
          />
          <p className="max-w-sm text-white/90">{tagline}</p>
        </div>
        <nav className="hidden flex-col gap-3 md:flex md:items-end">
          <Link href="/terminos" className="font-bold text-[var(--mks-cyan)] hover:underline">
            {termsLabel}
          </Link>
          <Link href="/privacidad" className="font-bold text-[var(--mks-cyan)] hover:underline">
            {privacyLabel}
          </Link>
          <Link href="/login?next=/dashboard" className="font-bold text-[var(--mks-pink)] hover:underline">
            Acceso empleados
          </Link>
          <Link href="/catalogo" className="text-white/90 hover:text-white">
            Catálogo
          </Link>
          <Link href="/nosotros" className="font-bold text-[var(--mks-cyan)] hover:underline">
            Nosotros
          </Link>
          <Link href="/contactanos" className="font-bold text-[var(--mks-cyan)] hover:underline">
            Contáctanos
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-white/60 md:text-left">
        © {new Date().getFullYear()} {copyright}. Colombia.
      </p>
    </footer>
  );
}
