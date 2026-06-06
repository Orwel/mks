"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export type ContactFormState = {
  ok: boolean;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(
  _prev: ContactFormState | null,
  formData: FormData,
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) {
    return { ok: false, message: "Escribe tu nombre (mínimo 2 caracteres)." };
  }

  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Ingresa un correo electrónico válido." };
  }

  if (message.length < 10) {
    return { ok: false, message: "El mensaje debe tener al menos 10 caracteres." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contact_messages").insert({ name, email, message });

  if (error) {
    return { ok: false, message: "No pudimos enviar tu mensaje. Intenta de nuevo más tarde." };
  }

  return {
    ok: true,
    message: "¡Gracias! Recibimos tu mensaje y te responderemos pronto.",
  };
}
