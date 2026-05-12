import Image from "next/image";
import Link from "next/link";

import type { BannerRow } from "@/infrastructure/supabase/queries/landing";
import { brandAssets } from "@/shared/constants/brand";

type Props = {
  banners: BannerRow[];
};

export function LandingBanners({ banners }: Props) {
  const hero = banners.filter((b) => b.position === "hero");
  const secondary = banners.filter((b) => b.position !== "hero");

  return (
    <section className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] px-4 py-12 md:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mks-pink)]">
              Ofertas &amp; novedades
            </p>
            <h2 className="font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
              Destacados
            </h2>
          </div>
        </header>

        {hero.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {hero.map((b) => (
              <BannerCard key={b.id} banner={b} large />
            ))}
          </div>
        ) : (
          <Link
            href="/catalogo"
            className="group relative block overflow-hidden rounded-2xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] shadow-[8px_8px_0_0_var(--mks-ink)] transition-transform hover:-translate-y-0.5"
          >
            <div className="relative aspect-[21/9] min-h-[200px] w-full md:aspect-[24/9]">
              <Image
                src={brandAssets.logoPrimary}
                alt="My Korea Store"
                fill
                className="object-contain p-6 md:p-10"
                sizes="(max-width: 768px) 100vw, 1200px"
                priority
              />
            </div>
            <div className="border-t-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-4 py-3 text-center text-sm font-bold text-[var(--mks-ink)]">
              Ver catálogo completo →
            </div>
          </Link>
        )}

        {secondary.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((b) => (
              <BannerCard key={b.id} banner={b} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BannerCard({
  banner,
  large = false,
}: {
  banner: BannerRow;
  large?: boolean;
}) {
  const inner = (
    <>
      <div
        className={`relative w-full overflow-hidden bg-white ${large ? "aspect-[16/10] min-h-[220px]" : "aspect-[4/3] min-h-[160px]"}`}
      >
        <Image
          src={banner.image_url}
          alt={banner.title ?? "Banner"}
          fill
          className="object-cover"
          sizes={large ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 640px) 100vw, 33vw"}
        />
        {(banner.title || banner.subtitle) && (
          <div className="absolute inset-x-0 bottom-0 border-t-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)]/95 px-3 py-2 text-[var(--mks-ink)]">
            {banner.title && (
              <p className="font-heading text-sm font-black md:text-base">{banner.title}</p>
            )}
            {banner.subtitle && (
              <p className="text-xs font-medium opacity-90">{banner.subtitle}</p>
            )}
          </div>
        )}
      </div>
    </>
  );

  const cardClass =
    "block overflow-hidden rounded-xl border-4 border-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)] transition-transform hover:-translate-y-0.5";

  if (banner.link_url) {
    return (
      <Link href={banner.link_url} className={cardClass}>
        {inner}
      </Link>
    );
  }
  return <div className={cardClass}>{inner}</div>;
}
