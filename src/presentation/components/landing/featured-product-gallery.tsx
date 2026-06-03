"use client";

import type { BannerImage } from "@/infrastructure/supabase/queries/landing";
import { ImageGallery } from "@/presentation/components/shared/image-gallery";

type Props = {
  name: string;
  images: BannerImage[];
};

/** Galería compacta para tarjetas de productos destacados en la portada. */
export function FeaturedProductGallery({ name, images }: Props) {
  if (images.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center font-heading text-lg font-black text-[var(--mks-ink)]">
        {name}
      </div>
    );
  }

  return (
    <ImageGallery
      name={name}
      images={images.map((img) => ({ id: img.id, url: img.url, alt: img.alt }))}
      sizes="220px"
      className="h-full space-y-0"
      mainClassName="aspect-square h-full min-h-0 rounded-none border-0 shadow-none"
      showThumbnails={images.length > 1}
    />
  );
}
