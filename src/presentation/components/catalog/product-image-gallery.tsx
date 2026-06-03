"use client";

import type { ProductDetailImage } from "@/infrastructure/supabase/queries/catalog";
import { ImageGallery } from "@/presentation/components/shared/image-gallery";

type Props = {
  name: string;
  images: ProductDetailImage[];
};

export function ProductImageGallery({ name, images }: Props) {
  return (
    <ImageGallery
      name={name}
      images={images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt_text,
      }))}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}
