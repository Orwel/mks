import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerRow } from "@/infrastructure/supabase/queries/landing";
import type { SiteHeroSettings } from "@/infrastructure/supabase/queries/site-settings";
import { LandingHeroBannersPanel } from "@/presentation/components/landing/landing-hero-banners-panel";
import { siteConfig } from "@/shared/config/site";

const HERO_DEFAULTS: Required<SiteHeroSettings> = {
  badge: "From Korea to K-lover",
  title: "Auténtico sabor coreano, directo a tu puerta",
  subtitle:
    "Snacks, skincare, bebidas y más — con la energía visual de My Korea Store.",
  cta_catalog: "Ver catálogo",
  cta_login: "Ingresar",
  bg_from: "#fff8f5",
  bg_via: "#ffffff",
  bg_to: "rgba(0,212,221,0.25)",
};

type Props = {
  heroDestacados?: BannerRow[];
  hero?: SiteHeroSettings;
};

export function LandingHero({ heroDestacados = [], hero = {} }: Props) {
  const badge = hero.badge?.trim() || HERO_DEFAULTS.badge;
  const title = hero.title?.trim() || HERO_DEFAULTS.title;
  const subtitle = hero.subtitle?.trim() || HERO_DEFAULTS.subtitle;
  const ctaCatalog = hero.cta_catalog?.trim() || HERO_DEFAULTS.cta_catalog;
  const ctaLogin = hero.cta_login?.trim() || HERO_DEFAULTS.cta_login;
  const bgFrom = hero.bg_from?.trim() || HERO_DEFAULTS.bg_from;
  const bgVia = hero.bg_via?.trim() || HERO_DEFAULTS.bg_via;
  const bgTo = hero.bg_to?.trim() || HERO_DEFAULTS.bg_to;

  return (
    <section
      className="relative overflow-hidden border-b-4 border-[var(--mks-ink)]"
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${bgFrom}, ${bgVia}, ${bgTo})`,
      }}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--mks-pink)]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[var(--mks-cyan)]/30 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-[88rem] items-center gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14 lg:py-28 lg:pl-6 lg:pr-10 xl:gap-16 xl:pl-8 xl:pr-12 2xl:pl-10">
        <div className="w-full max-w-2xl justify-self-start space-y-6 sm:space-y-8 sm:max-w-3xl lg:max-w-none">
          <div className="inline-flex rotate-[-2deg] items-center gap-2 rounded-full border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]">
            {badge}
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--mks-pink)]">
              {siteConfig.shortName}
            </p>
            <h1 className="mt-3 font-heading text-4xl font-black leading-[1.05] tracking-tight text-[var(--mks-ink)] md:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-[42rem] text-pretty text-lg font-medium text-neutral-800 md:text-xl lg:max-w-none">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/catalogo"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 w-full rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-6 text-base font-black text-white shadow-[6px_6px_0_0_var(--mks-ink)] transition sm:w-auto [a]:hover:bg-[var(--mks-yellow)] [a]:hover:text-[var(--mks-ink)]",
              )}
            >
              {ctaCatalog}
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full rounded-xl border-4 border-[var(--mks-ink)] bg-white px-6 text-base font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-cyan)] hover:bg-[var(--mks-yellow)] sm:w-auto",
              )}
            >
              {ctaLogin}
            </Link>
          </div>
        </div>

        <LandingHeroBannersPanel banners={heroDestacados} />
      </div>
    </section>
  );
}
