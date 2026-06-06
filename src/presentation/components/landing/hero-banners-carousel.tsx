"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { BannerRow } from "@/infrastructure/supabase/queries/landing";
import { HeroBannerGallery } from "@/presentation/components/landing/hero-banner-gallery";

/** Intervalo entre destacados en el panel hero. */
const ROTATE_MS = 10_000;

type Props = {
  banners: BannerRow[];
};

export function HeroBannersCarousel({ banners }: Props) {
  const count = banners.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timerEpoch, setTimerEpoch] = useState(0);

  const resetAutoTimer = useCallback(() => {
    setTimerEpoch((e) => e + 1);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
      resetAutoTimer();
    },
    [count, resetAutoTimer],
  );

  const goPrev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);

  const goNext = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  useEffect(() => {
    if (index >= count && count > 0) {
      setIndex(0);
    }
  }, [index, count]);

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i >= count - 1 ? 0 : i + 1));
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count, paused, timerEpoch]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, goNext, goPrev]);

  const active = banners[index];
  if (!active) return null;

  return (
    <div
      className="relative"
      aria-roledescription="carrusel"
      aria-label="Destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div key={active.id} className="animate-in fade-in duration-300">
        <HeroBannerGallery banner={active} priority={index === 0} />
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Destacado anterior"
            className="absolute left-3 top-[42%] z-20 -translate-y-1/2 rounded-lg border-4 border-[var(--mks-ink)] bg-white/95 p-2.5 text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Destacado siguiente"
            className="absolute right-3 top-[42%] z-20 -translate-y-1/2 rounded-lg border-4 border-[var(--mks-ink)] bg-white/95 p-2.5 text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)]"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <p className="absolute right-3 top-3 z-20 rounded-md border-2 border-[var(--mks-ink)] bg-white/90 px-2.5 py-0.5 text-xs font-black text-[var(--mks-ink)]">
            {index + 1} / {count}
          </p>
          <div
            className="flex justify-center gap-2 border-t-2 border-dashed border-[var(--mks-ink)]/15 bg-[var(--mks-cream)]/80 px-4 py-2.5"
            role="tablist"
            aria-label="Indicadores de destacados"
          >
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir al destacado ${i + 1}`}
                onClick={() => goTo(i)}
                className={[
                  "h-2 rounded-full border-2 border-[var(--mks-ink)] transition-all",
                  i === index
                    ? "w-8 bg-[var(--mks-pink)]"
                    : "w-2 bg-white/80 hover:bg-[var(--mks-yellow)]",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
