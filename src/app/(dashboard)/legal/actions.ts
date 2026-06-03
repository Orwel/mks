"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function createLegalDocument(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const type = String(formData.get("type") ?? "terms") as "terms" | "privacy";
  const version = String(formData.get("version") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!version || !content) return;
  const { error } = await supabase.from("legal_documents").insert({
    type,
    version,
    content,
    is_current: false,
  });
  if (error) {
    console.error("[createLegalDocument]", error.message);
    return;
  }
  revalidatePath("/legal");
  revalidatePath("/terminos");
  revalidatePath("/privacidad");
}

export async function publishLegalDocument(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: doc, error: readErr } = await supabase
    .from("legal_documents")
    .select("id, type")
    .eq("id", id)
    .maybeSingle();
  if (readErr || !doc) {
    console.error("[publishLegalDocument] read", readErr?.message);
    return;
  }

  const { error: clearErr } = await supabase
    .from("legal_documents")
    .update({ is_current: false })
    .eq("type", doc.type)
    .eq("is_current", true);
  if (clearErr) {
    console.error("[publishLegalDocument] clear", clearErr.message);
    return;
  }

  const { error: setErr } = await supabase.from("legal_documents").update({ is_current: true }).eq("id", id);
  if (setErr) {
    console.error("[publishLegalDocument] set", setErr.message);
    return;
  }

  revalidatePath("/legal");
  revalidatePath("/terminos");
  revalidatePath("/privacidad");
}

export async function publishLegalDocumentForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await publishLegalDocument(id);
}
