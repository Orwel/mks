import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerRow } from "@/infrastructure/supabase/queries/landing";
import { LandingHeroBannersPanel } from "@/presentation/components/landing/landing-hero-banners-panel";
import { siteConfig } from "@/shared/config/site";

type Props = {
  heroBanners?: BannerRow[];
};

/** Hero “bloques”: mitades de color, panel de contenido destacado a la derecha. */
export function LandingHeroVariant3({ heroBanners = [] }: Props) {
  return (
    <section className="relative overflow-hidden border-b-4 border-[var(--mks-ink)]">
      <div className="grid md:grid-cols-2">
        <div className="relative flex min-h-[320px] flex-col justify-center border-b-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-8 py-14 md:border-b-0 md:border-r-4">
          <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)]/40" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--mks-ink)]">
            {siteConfig.shortName}
          </p>
          <h1 className="mt-4 font-heading text-3xl font-black leading-[1.05] tracking-tight text-white drop-shadow-[2px_2px_0_var(--mks-ink)] md:text-4xl lg:text-5xl">
            Tu tienda K-favorite
          </h1>
          <p className="mt-4 max-w-sm text-sm font-bold text-[var(--mks-ink)]/90 md:text-base">
            {siteConfig.description} Todo en un solo lugar, con la energía MKS.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-5 text-sm font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)]",
              )}
            >
              Ver catálogo
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[320px] items-center justify-center bg-[var(--mks-cream)] px-4 py-10 md:px-8 md:py-14">
          <LandingHeroBannersPanel banners={heroBanners} />
        </div>
      </div>
    </section>
  );
}
