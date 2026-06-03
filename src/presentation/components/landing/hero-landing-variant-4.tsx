import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerRow } from "@/infrastructure/supabase/queries/landing";
import { LandingHeroBannersPanel } from "@/presentation/components/landing/landing-hero-banners-panel";
import { siteConfig } from "@/shared/config/site";

type Props = {
  /** Banners con posición `hero` (tabla `banners`, panel /banners). */
  heroBanners: BannerRow[];
};

/** Landing principal con panel derecho de banners dinámicos (admin). */
export function LandingHeroVariant4({ heroBanners }: Props) {
  return (
    <section className="relative overflow-hidden border-b-4 border-[var(--mks-ink)] bg-gradient-to-br from-[var(--mks-cream)] via-white to-[var(--mks-cyan)]/25">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--mks-pink)]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[var(--mks-cyan)]/30 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-[88rem] items-center gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14 lg:py-28 lg:pl-6 lg:pr-10 xl:gap-16 xl:pl-8 xl:pr-12 2xl:pl-10">
        <div className="w-full max-w-2xl justify-self-start space-y-8 sm:max-w-3xl lg:max-w-none">
          <div className="inline-flex rotate-[-2deg] items-center gap-2 rounded-full border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]">
            <span>From</span>
            <span className="text-[var(--mks-pink)]">Korea</span>
            <span>to</span>
            <span>K-lover</span>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--mks-pink)]">
              {siteConfig.shortName}
            </p>
            <h1 className="mt-3 font-heading text-4xl font-black leading-[1.05] tracking-tight text-[var(--mks-ink)] md:text-5xl lg:text-6xl">
              Auténtico sabor coreano, directo a tu puerta
            </h1>
            <p className="mt-5 max-w-[42rem] text-pretty text-lg font-medium text-neutral-800 md:text-xl lg:max-w-none">
              {siteConfig.description} Snacks, skincare, bebidas y más — con la energía visual
              de My Korea Store.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/catalogo"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-6 text-base font-black text-white shadow-[6px_6px_0_0_var(--mks-ink)] hover:bg-[var(--mks-pink)]/90",
              )}
            >
              Ver catálogo
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-xl border-4 border-[var(--mks-ink)] bg-white px-6 text-base font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-cyan)] hover:bg-[var(--mks-cream)]",
              )}
            >
              Ingresar
            </Link>
          </div>
        </div>

        <LandingHeroBannersPanel banners={heroBanners} />
      </div>
    </section>
  );
}
