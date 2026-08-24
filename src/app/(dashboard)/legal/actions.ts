"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { requireAdmin } from "@/infrastructure/supabase/auth-session";

export type LegalActionState = {
  status: "idle" | "ok" | "error";
  message: string;
};

export const legalInitialState: LegalActionState = { status: "idle", message: "" };

const LEGAL_TYPES = ["terms", "privacy"] as const;
type LegalType = (typeof LEGAL_TYPES)[number];

function isLegalType(value: string): value is LegalType {
  return (LEGAL_TYPES as readonly string[]).includes(value);
}

function revalidateLegal() {
  revalidatePath("/legal");
  revalidatePath("/terminos");
  revalidatePath("/privacidad");
}

/** Crea una versión nueva en borrador. No la publica. */
export async function createLegalDocument(
  _prev: LegalActionState,
  formData: FormData,
): Promise<LegalActionState> {
  await requireAdmin();

  const type = String(formData.get("type") ?? "");
  const version = String(formData.get("version") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const effectiveDate = String(formData.get("effective_date") ?? "").trim();

  if (!isLegalType(type)) {
    return { status: "error", message: "Tipo de documento no válido." };
  }
  if (!version) {
    return { status: "error", message: "La versión es obligatoria (ej. 1.1.0)." };
  }
  if (!content) {
    return { status: "error", message: "El contenido no puede estar vacío." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("legal_documents").insert({
    type,
    version,
    title,
    content,
    effective_date: effectiveDate || null,
    is_current: false,
  });

  if (error) {
    const duplicate = error.code === "23505";
    return {
      status: "error",
      message: duplicate
        ? `Ya existe la versión ${version} de ese documento. Usa otro número.`
        : `No se pudo guardar: ${error.message}`,
    };
  }

  revalidateLegal();
  return { status: "ok", message: `Borrador ${version} guardado. Publícalo cuando esté listo.` };
}

/** Edita el contenido de un borrador (no permite tocar la versión vigente). */
export async function updateLegalDraft(
  _prev: LegalActionState,
  formData: FormData,
): Promise<LegalActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const effectiveDate = String(formData.get("effective_date") ?? "").trim();

  if (!id) return { status: "error", message: "Falta el identificador del documento." };
  if (!content) return { status: "error", message: "El contenido no puede estar vacío." };

  const admin = createSupabaseAdminClient();

  const { data: doc } = await admin
    .from("legal_documents")
    .select("id, is_current, version")
    .eq("id", id)
    .maybeSingle();

  if (!doc) return { status: "error", message: "Documento no encontrado." };
  if (doc.is_current) {
    return {
      status: "error",
      message:
        "No se puede editar la versión vigente: se rompería la trazabilidad de quienes ya la aceptaron. Crea una versión nueva.",
    };
  }

  const { error } = await admin
    .from("legal_documents")
    .update({ title, content, effective_date: effectiveDate || null })
    .eq("id", id);

  if (error) return { status: "error", message: `No se pudo guardar: ${error.message}` };

  revalidateLegal();
  return { status: "ok", message: `Borrador ${doc.version} actualizado.` };
}

/** Publica una versión: la deja vigente y desactiva la anterior del mismo tipo. */
export async function publishLegalDocument(
  _prev: LegalActionState,
  formData: FormData,
): Promise<LegalActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Falta el identificador del documento." };

  const admin = createSupabaseAdminClient();

  const { data: doc, error: readErr } = await admin
    .from("legal_documents")
    .select("id, type, version")
    .eq("id", id)
    .maybeSingle();

  if (readErr) return { status: "error", message: `No se pudo leer: ${readErr.message}` };
  if (!doc) return { status: "error", message: "Documento no encontrado." };

  const { error: clearErr } = await admin
    .from("legal_documents")
    .update({ is_current: false })
    .eq("type", doc.type)
    .eq("is_current", true);

  if (clearErr) {
    return { status: "error", message: `No se pudo desactivar la anterior: ${clearErr.message}` };
  }

  const { error: setErr } = await admin
    .from("legal_documents")
    .update({ is_current: true, published_at: new Date().toISOString() })
    .eq("id", id);

  if (setErr) return { status: "error", message: `No se pudo publicar: ${setErr.message}` };

  revalidateLegal();
  return {
    status: "ok",
    message: `Versión ${doc.version} publicada. Las aceptaciones nuevas quedarán ligadas a ella.`,
  };
}
