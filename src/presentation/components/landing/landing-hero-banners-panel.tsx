import Image from "next/image";
import Link from "next/link";

import type { BannerRow } from "@/infrastructure/supabase/queries/landing";
import { HeroBannerGallery } from "@/presentation/components/landing/hero-banner-gallery";
import { HeroBannersCarousel } from "@/presentation/components/landing/hero-banners-carousel";
import { brandAssets } from "@/shared/constants/brand";
import { siteConfig } from "@/shared/config/site";

type Props = {
  banners: BannerRow[];
};

/** Panel derecho del hero: destacados activos (posición hero) desde el panel admin. */
export function LandingHeroBannersPanel({ banners }: Props) {
  return (
    <aside className="relative flex w-full min-w-0 flex-1 justify-center lg:justify-end lg:justify-self-stretch lg:pl-4 xl:pl-6">
      <div className="relative w-full max-w-[920px] lg:ml-auto lg:w-full lg:max-w-none lg:translate-x-1 xl:translate-x-2">
        <div className="absolute -inset-4 rounded-3xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] shadow-[14px_14px_0_0_var(--mks-ink)]" />
        <div className="relative overflow-hidden rounded-2xl border-4 border-[var(--mks-ink)] bg-white shadow-[10px_10px_0_0_var(--mks-pink)]">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-4 border-[var(--mks-ink)] bg-gradient-to-r from-[var(--mks-pink)]/20 via-white to-[var(--mks-cyan)]/30 px-5 py-3.5">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[var(--mks-pink)]">
                Ofertas &amp; novedades
              </p>
              <h2 className="font-heading text-xl font-black text-[var(--mks-ink)] sm:text-2xl lg:text-[1.65rem]">
                Destacados
              </h2>
            </div>
          </div>

          {banners.length > 0 ? (
            banners.length > 1 ? (
              <HeroBannersCarousel banners={banners} />
            ) : (
              <HeroBannerGallery banner={banners[0]!} priority />
            )
          ) : (
            <Link
              href="/catalogo"
              className="group block transition-transform hover:-translate-y-0.5"
            >
              <div className="relative aspect-[4/3] min-h-[280px] w-full bg-[var(--mks-pink)] sm:min-h-[340px] md:min-h-[400px] lg:min-h-[440px] xl:min-h-[460px]">
                <Image
                  src={brandAssets.logoPrimary}
                  alt={siteConfig.name}
                  fill
                  className="object-contain p-8 md:p-10"
                  sizes="(max-width: 1280px) 54vw, 920px"
                  priority
                />
              </div>
            </Link>
          )}

          <Link
            href="/catalogo"
            className="flex items-center justify-center border-t-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-4 py-3 text-sm font-black text-[var(--mks-ink)] transition hover:bg-[var(--mks-yellow)]"
          >
            Ver catálogo completo →
          </Link>
        </div>
      </div>
    </aside>
  );
}
