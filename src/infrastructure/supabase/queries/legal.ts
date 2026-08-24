import "server-only";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export type LegalDocumentType = "terms" | "privacy";

export type LegalDocument = {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  published_at: string;
  effective_date: string | null;
};

export const LEGAL_ROUTES: Record<LegalDocumentType, string> = {
  terms: "/terminos",
  privacy: "/privacidad",
};

export const LEGAL_FALLBACK_TITLE: Record<LegalDocumentType, string> = {
  terms: "Términos y condiciones",
  privacy: "Política de tratamiento de datos personales",
};

/**
 * Documento legal vigente. Única fuente de verdad: `legal_documents`.
 * No hay copias del texto en el código ni en `site_settings`.
 */
export async function getCurrentLegalDocument(
  type: LegalDocumentType,
): Promise<LegalDocument | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("legal_documents")
    .select("id, type, version, title, content, published_at, effective_date")
    .eq("type", type)
    .eq("is_current", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: String(data.id),
    type: data.type as LegalDocumentType,
    version: String(data.version),
    title: (data.title as string) || LEGAL_FALLBACK_TITLE[type],
    content: String(data.content),
    published_at: String(data.published_at),
    effective_date: (data.effective_date as string | null) ?? null,
  };
}

/** Referencia mínima (id + versión) de ambos documentos vigentes. */
export async function getCurrentLegalRefs(): Promise<{
  terms: { id: string; version: string } | null;
  privacy: { id: string; version: string } | null;
}> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("legal_documents")
    .select("id, type, version")
    .eq("is_current", true);

  const rows = (data ?? []) as { id: string; type: string; version: string }[];
  const find = (t: string) => {
    const row = rows.find((r) => r.type === t);
    return row ? { id: String(row.id), version: String(row.version) } : null;
  };

  return { terms: find("terms"), privacy: find("privacy") };
}
