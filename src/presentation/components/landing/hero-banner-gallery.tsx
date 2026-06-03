"use client";

import Link from "next/link";

import type { BannerRow } from "@/infrastructure/supabase/queries/landing";
import { ImageGallery } from "@/presentation/components/shared/image-gallery";

type Props = {
  banner: BannerRow;
  priority?: boolean;
};

export function HeroBannerGallery({ banner, priority = false }: Props) {
  const alt = banner.title ?? "Destacado";
  const galleryImages = banner.images.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt ?? alt,
  }));

  const imageBlock = (
    <div className="relative w-full bg-white">
      <ImageGallery
        name={alt}
        images={galleryImages}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 54vw, 920px"
        mainClassName="aspect-[4/3] min-h-[280px] rounded-none border-0 shadow-none sm:min-h-[340px] md:min-h-[400px] lg:min-h-[440px] xl:min-h-[460px]"
        showThumbnails={galleryImages.length > 1}
        priority={priority}
      />
      {(banner.title || banner.subtitle) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 border-t-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)]/95 px-4 py-2.5 text-[var(--mks-ink)] sm:py-3">
          {banner.title ? (
            <p className="font-heading text-sm font-black leading-tight sm:text-base md:text-lg">
              {banner.title}
            </p>
          ) : null}
          {banner.subtitle ? (
            <p className="mt-0.5 text-xs font-medium opacity-90 sm:text-sm">{banner.subtitle}</p>
          ) : null}
        </div>
      )}
    </div>
  );

  if (banner.link_url) {
    return (
      <Link
        href={banner.link_url}
        className="block transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--mks-pink)]"
      >
        {imageBlock}
      </Link>
    );
  }

  return imageBlock;
}

