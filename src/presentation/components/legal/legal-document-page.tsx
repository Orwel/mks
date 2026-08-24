import Link from "next/link";

import {
  getCurrentLegalDocument,
  LEGAL_FALLBACK_TITLE,
  type LegalDocumentType,
} from "@/infrastructure/supabase/queries/legal";
import { LegalMarkdown } from "@/presentation/components/legal/legal-markdown";

const OTHER: Record<LegalDocumentType, { href: string; label: string }> = {
  terms: { href: "/privacidad", label: "Ver la Política de privacidad" },
  privacy: { href: "/terminos", label: "Ver los Términos y condiciones" },
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

export async function LegalDocumentPage({ type }: { type: LegalDocumentType }) {
  const doc = await getCurrentLegalDocument(type);

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-16">
        <h1 className="font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)]">
          {LEGAL_FALLBACK_TITLE[type]}
        </h1>
        <p className="text-neutral-700">
          Todavía no hay una versión vigente publicada. El documento se administra desde
          el panel, en la sección <strong>Legal</strong>.
        </p>
        <Link
          href="/"
          className="inline-block font-black text-[var(--mks-pink)] underline underline-offset-4"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const effective = formatDate(doc.effective_date) ?? formatDate(doc.published_at);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <div className="mb-8 rounded-xl border-4 border-[var(--mks-ink)] bg-white p-4 text-xs font-bold uppercase tracking-wide text-neutral-600 shadow-[6px_6px_0_0_var(--mks-ink)]">
        Versión {doc.version}
        {effective ? <> · Vigente desde el {effective}</> : null}
      </div>

      <LegalMarkdown content={doc.content} />

      <div className="mt-12 flex flex-wrap gap-4 border-t-4 border-dashed border-[var(--mks-ink)]/20 pt-6 text-sm">
        <Link
          href={OTHER[type].href}
          className="font-black text-[var(--mks-pink)] underline underline-offset-4"
        >
          {OTHER[type].label}
        </Link>
        <Link href="/" className="font-black text-[var(--mks-ink)] underline underline-offset-4">
          Volver al inicio
        </Link>
      </div>
    </article>
  );
}

export async function buildLegalMetadata(type: LegalDocumentType) {
  const doc = await getCurrentLegalDocument(type);
  const title = doc?.title || LEGAL_FALLBACK_TITLE[type];
  return {
    title,
    description:
      type === "terms"
        ? "Términos y condiciones de uso y de compra de My Korea Store, operada por IKEBANA CO S.A.S."
        : "Política de tratamiento de datos personales de IKEBANA CO S.A.S. conforme a la Ley 1581 de 2012.",
  };
}
