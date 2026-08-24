"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { canUseNextImage } from "@/shared/lib/next-image-remote";

export type GalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
};

type Props = {
  name: string;
  images: GalleryImage[];
  sizes?: string;
  className?: string;
  mainClassName?: string;
  showThumbnails?: boolean;
  priority?: boolean;
};

function GalleryPicture({
  src,
  alt,
  fill,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  const imgClass = fill
    ? ["absolute inset-0 h-full w-full object-cover", className].filter(Boolean).join(" ")
    : className;

  // eslint-disable-next-line @next/next/no-img-element -- URLs legacy del admin
  return <img src={src} alt={alt} className={imgClass} />;
}

export function ImageGallery({
  name,
  images,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className,
  mainClassName,
  showThumbnails = true,
  priority = false,
}: Props) {
  const [rawIndex, setActiveIndex] = useState(0);
  const count = images.length;

  // Al cambiar de producto (o de versión) la galería vuelve a la primera foto.
  // Se ajusta durante el render en lugar de con un efecto, que disparaba un
  // render en cascada y dejaba un fotograma con la imagen anterior.
  const [syncedImages, setSyncedImages] = useState(images);
  if (syncedImages !== images) {
    setSyncedImages(images);
    setActiveIndex(0);
  }

  const activeIndex = count > 0 ? Math.min(rawIndex, count - 1) : 0;
  const active = images[activeIndex];

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i <= 0 ? count - 1 : i - 1));
  }, [count]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i >= count - 1 ? 0 : i + 1));
  }, [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, goNext, goPrev]);

  if (count === 0) {
    return (
      <div className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl border-4 border-[var(--mks-ink)] bg-gradient-to-br from-[var(--mks-pink)]/30 to-[var(--mks-cyan)]/40 shadow-[8px_8px_0_0_var(--mks-ink)]",
          className,
        )}>
        <div className="flex h-full items-center justify-center p-8 text-center font-heading text-2xl font-black text-[var(--mks-ink)] md:text-3xl">
          {name}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] shadow-[8px_8px_0_0_var(--mks-ink)]",
          mainClassName,
        )}
      >
        <GalleryPicture
          src={active.url}
          alt={active.alt ?? name}
          fill
          className="object-cover"
          sizes={sizes}
          priority={priority}
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-lg border-4 border-[var(--mks-ink)] bg-white/95 p-2 text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-lg border-4 border-[var(--mks-ink)] bg-white/95 p-2 text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)]"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <p className="absolute bottom-3 right-3 rounded-md border-2 border-[var(--mks-ink)] bg-white/90 px-2 py-0.5 text-xs font-black text-[var(--mks-ink)]">
              {activeIndex + 1} / {count}
            </p>
          </>
        ) : null}
      </div>
      {showThumbnails && count > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === activeIndex}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-4 transition",
                i === activeIndex
                  ? "border-[var(--mks-pink)] shadow-[3px_3px_0_0_var(--mks-ink)]"
                  : "border-[var(--mks-ink)] opacity-70 hover:opacity-100",
              )}
            >
              <GalleryPicture
                src={img.url}
                alt={img.alt ?? `${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
