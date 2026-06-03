import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerRow } from "@/infrastructure/supabase/queries/landing";
import { LandingHeroBannersPanel } from "@/presentation/components/landing/landing-hero-banners-panel";
import { siteConfig } from "@/shared/config/site";

type Props = {
  heroBanners?: BannerRow[];
};

/** Hero “editorial”: fondo oscuro, tipografía grande, acento en líneas cyan/rosa. */
export function LandingHeroVariant2({ heroBanners = [] }: Props) {
  return (
    <section className="relative overflow-hidden border-b-4 border-[var(--mks-ink)] bg-[var(--mks-ink)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
        <div className="absolute left-0 top-0 h-full w-1 bg-[var(--mks-cyan)]" />
        <div className="absolute bottom-0 right-0 h-1 w-2/3 bg-[var(--mks-pink)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-12 xl:px-16">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-end lg:justify-between lg:gap-16 xl:gap-20">
          <div className="max-w-lg shrink-0 space-y-8 lg:max-w-md xl:max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--mks-cyan)]">
              {siteConfig.shortName} — propuesta editorial
            </p>
            <h1 className="font-heading text-4xl font-black leading-[1.08] tracking-tight text-white md:text-5xl lg:text-[3.25rem]">
              Korea auténtica,
              <span className="block text-[var(--mks-pink)]">sin ruido.</span>
            </h1>
            <p className="max-w-lg text-pretty text-base font-medium leading-relaxed text-white/75 md:text-lg">
              {siteConfig.description} Curamos snacks, cuidado de piel y bebidas con narrativa clara
              y envíos en Colombia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 rounded-xl border-4 border-white bg-[var(--mks-pink)] px-6 text-base font-black text-white shadow-[6px_6px_0_0_var(--mks-cyan)] hover:opacity-95",
                )}
              >
                Explorar catálogo
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-xl border-4 border-white/80 bg-transparent px-6 text-base font-black text-white shadow-[4px_4px_0_0_var(--mks-pink)] hover:bg-white/10",
                )}
              >
                Ingresar
              </Link>
            </div>
          </div>

          <LandingHeroBannersPanel banners={heroBanners} />
        </div>

        <div className="mt-16 flex flex-wrap gap-x-8 gap-y-2 border-t-2 border-dashed border-white/25 pt-8 text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-cyan)]">
          <span>K-Beauty</span>
          <span className="text-[var(--mks-pink)]">Snacks</span>
          <span>Lifestyle</span>
          <span className="text-white/50">Envíos CO</span>
        </div>
      </div>
    </section>
  );
}
