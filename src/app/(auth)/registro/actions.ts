"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getCurrentLegalRefs } from "@/infrastructure/supabase/queries/legal";

const schema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  acceptTerms: z.boolean(),
  acceptPrivacy: z.boolean(),
  marketingOptIn: z.boolean(),
  redirectTo: z.string().optional(),
});

export type RegisterInput = z.input<typeof schema>;

export type RegisterResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

/**
 * Alta de cliente con registro de la aceptación de los actos jurídicos.
 *
 * Corre en el servidor para poder capturar IP y user agent, que son la prueba
 * de la autorización previa, expresa e informada (Ley 1581 de 2012, art. 9;
 * Decreto 1074 de 2015, art. 2.2.2.25.2.4). La versión aceptada se toma de
 * `legal_documents` (is_current), que es la única fuente de verdad del texto.
 */
export async function registerCustomer(input: RegisterInput): Promise<RegisterResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisa los datos del formulario." };
  }
  const values = parsed.data;

  if (!values.acceptTerms) {
    return { ok: false, error: "Debes aceptar los Términos y condiciones para crear la cuenta." };
  }
  if (!values.acceptPrivacy) {
    return {
      ok: false,
      error: "Debes autorizar el tratamiento de tus datos personales para crear la cuenta.",
    };
  }

  const legal = await getCurrentLegalRefs();
  if (!legal.terms || !legal.privacy) {
    return {
      ok: false,
      error:
        "No hay una versión vigente de los documentos legales. Publícalos en el panel (Legal) antes de habilitar el registro.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { full_name: values.fullName },
      emailRedirectTo: values.redirectTo,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }

  // Supabase devuelve un usuario "en blanco" (sin identities) cuando el correo
  // ya está registrado, para no filtrar qué correos existen. No se registra
  // aceptación en ese caso porque no hubo alta.
  const alreadyRegistered = Array.isArray(user.identities) && user.identities.length === 0;
  if (alreadyRegistered) {
    return {
      ok: false,
      error: "Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.",
    };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = hdrs.get("user-agent");

  const admin = createSupabaseAdminClient();

  const { error: acceptanceError } = await admin.from("legal_acceptances").insert({
    user_id: user.id,
    email: values.email,
    terms_document_id: legal.terms.id,
    privacy_document_id: legal.privacy.id,
    terms_version: legal.terms.version,
    privacy_version: legal.privacy.version,
    accepted_terms: true,
    accepted_privacy: true,
    marketing_opt_in: values.marketingOptIn,
    source: "registration",
    ip_address: ip,
    user_agent: userAgent,
  });

  if (acceptanceError) {
    // La cuenta ya existe; sin la evidencia el registro es inválido para
    // efectos probatorios, así que se informa en lugar de continuar en silencio.
    console.error("[registerCustomer] legal_acceptances", acceptanceError.message);
    return {
      ok: false,
      error:
        "La cuenta se creó pero no pudimos registrar tu aceptación. Escríbenos a ikebanacojp@gmail.com antes de comprar.",
    };
  }

  if (values.marketingOptIn) {
    await admin.from("profiles").update({ marketing_opt_in: true }).eq("id", user.id);
  }

  return { ok: true, needsEmailConfirmation: !data.session };
}
