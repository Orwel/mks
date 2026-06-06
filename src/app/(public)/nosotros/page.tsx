import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "My Korea Store nace para acercar lo mejor de Corea del Sur a Latinoamérica. Somos una puerta de entrada a Corea del Sur.",
};

export default function NosotrosPage() {
  return (
    <div className="border-b-4 border-[var(--mks-ink)] bg-white">
      <section className="relative overflow-hidden border-b-4 border-[var(--mks-ink)] bg-gradient-to-br from-[var(--mks-cream)] via-white to-[var(--mks-cyan)]/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--mks-pink)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-[var(--mks-cyan)]/25 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-16 md:py-24">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--mks-pink)]">
            {siteConfig.shortName}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-black tracking-tight text-[var(--mks-ink)] md:text-5xl">
            Nosotros
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-8 px-6 py-14 md:py-20">
        <p className="text-lg font-medium leading-relaxed text-neutral-800 md:text-xl">
          My Korea Store nace para acercar lo mejor de Corea del Sur a Latinoamérica.
        </p>

        <p className="text-base leading-relaxed text-neutral-700 md:text-lg">
          Queremos conectar a millones de K-Lovers con productos originales, experiencias
          auténticas y una comunidad que comparte la pasión por la cultura coreana.
        </p>

        <div className="rounded-2xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] p-8 shadow-[8px_8px_0_0_var(--mks-ink)] md:p-10">
          <p className="font-heading text-2xl font-black leading-snug text-[var(--mks-ink)] md:text-3xl">
            No somos solo una tienda.
          </p>
          <p className="mt-4 font-heading text-xl font-black text-[var(--mks-pink)] md:text-2xl">
            Somos una puerta de entrada a Corea del Sur
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/catalogo"
            className="inline-flex rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-6 py-3 text-sm font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)]"
          >
            Explorar catálogo
          </Link>
        </div>
      </section>
    </div>
  );
}
