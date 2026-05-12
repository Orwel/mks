import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { brandAssets } from "@/shared/constants/brand";
import { siteConfig } from "@/shared/config/site";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b-4 border-[var(--mks-ink)] bg-gradient-to-br from-[var(--mks-cream)] via-white to-[var(--mks-cyan)]/25">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--mks-pink)]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[var(--mks-cyan)]/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
        <div className="space-y-8">
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
            <p className="mt-5 max-w-xl text-pretty text-lg font-medium text-neutral-800 md:text-xl">
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

        <div className="relative flex justify-center md:justify-end">
          <div className="relative w-full max-w-[340px]">
            <div className="absolute -inset-3 rounded-3xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] shadow-[12px_12px_0_0_var(--mks-ink)]" />
            <div className="relative rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[8px_8px_0_0_var(--mks-pink)]">
              <div className="relative aspect-square w-full">
                <Image
                  src={brandAssets.logoPrimary}
                  alt={`${siteConfig.name} — logo`}
                  fill
                  className="object-contain p-2"
                  sizes="340px"
                  priority
                />
              </div>
              <p className="mt-4 text-center font-heading text-xs font-bold uppercase tracking-[0.2em] text-[var(--mks-ink)]">
                Calidad K · envíos Colombia
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
