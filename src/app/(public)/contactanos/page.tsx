import type { Metadata } from "next";

import { ContactForm } from "@/presentation/components/contact/contact-form";
import { siteConfig } from "@/shared/config/site";

export const metadata: Metadata = {
  title: "Contáctanos",
  description:
    "¿Tienes preguntas, sugerencias o quieres ponerte en contacto con nosotros? Escríbenos y te responderemos pronto.",
};

export default function ContactanosPage() {
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
            Contáctanos
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-8 px-6 py-14 md:py-20">
        <div className="space-y-4">
          <p className="text-lg font-medium leading-relaxed text-neutral-800 md:text-xl">
            ¿Tienes preguntas, sugerencias o quieres ponerte en contacto con nosotros?
          </p>
          <p className="text-base leading-relaxed text-neutral-700 md:text-lg">
            Nuestro equipo está listo para ayudarte y seguir construyendo la comunidad coreana
            más grande de Latinoamérica.
          </p>
        </div>

        <div className="rounded-2xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] p-8 shadow-[8px_8px_0_0_var(--mks-ink)] md:p-10">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
