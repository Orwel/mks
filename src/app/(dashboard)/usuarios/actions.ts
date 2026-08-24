"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/infrastructure/supabase/auth-session";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import type { UserRole } from "@/core/value-objects/user-role";
import { USER_ROLES } from "@/core/value-objects/user-role";

export type UsuariosActionState = {
  status: "idle" | "ok" | "error";
  message: string;
};

export const usuariosInitialState: UsuariosActionState = { status: "idle", message: "" };

function isUserRole(s: string): s is UserRole {
  return (USER_ROLES as readonly string[]).includes(s);
}

/**
 * Cambia el rol de un perfil.
 *
 * Se ejecuta con la clave `service_role`: la política RLS `profiles_update_admin`
 * y el trigger `profiles_role_guard` dejaban el UPDATE en 0 filas o lanzaban
 * excepción según la sesión, y la versión anterior descartaba el error en
 * `console.error`, así que el panel no cambiaba nada y no avisaba de nada.
 * La autorización se comprueba antes, en el servidor, con `requireAdmin()`.
 */
export async function updateProfileRole(
  userId: string,
  role: string,
): Promise<UsuariosActionState> {
  const session = await requireAdmin();

  if (!userId) {
    return { status: "error", message: "Falta el identificador del usuario." };
  }
  if (!isUserRole(role)) {
    return { status: "error", message: `Rol no válido: ${role}` };
  }
  if (userId === session.profile.id && role !== "admin") {
    return {
      status: "error",
      message: "No puedes quitarte a ti mismo el rol de administrador.",
    };
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id, full_name, role")
    .maybeSingle();

  if (error) {
    return { status: "error", message: `No se pudo actualizar: ${error.message}` };
  }
  if (!data) {
    return { status: "error", message: "No se encontró el perfil indicado." };
  }

  await admin.from("audit_log").insert({
    actor_id: session.profile.id,
    action: "profiles.role_changed_from_panel",
    entity_table: "profiles",
    entity_id: userId,
    metadata: { to: role },
  });

  revalidatePath("/usuarios");
  return {
    status: "ok",
    message: `${data.full_name || "Perfil"} ahora es «${data.role}».`,
  };
}

export async function updateProfileRoleForm(
  _prev: UsuariosActionState,
  formData: FormData,
): Promise<UsuariosActionState> {
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  return updateProfileRole(userId, role);
}

/** Activa / desactiva una cuenta sin borrarla. */
export async function setProfileActiveForm(
  _prev: UsuariosActionState,
  formData: FormData,
): Promise<UsuariosActionState> {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const nextActive = String(formData.get("is_active") ?? "") === "true";

  if (!userId) {
    return { status: "error", message: "Falta el identificador del usuario." };
  }
  if (userId === session.profile.id && !nextActive) {
    return { status: "error", message: "No puedes desactivar tu propia cuenta." };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ is_active: nextActive })
    .eq("id", userId)
    .select("id, full_name, is_active")
    .maybeSingle();

  if (error) {
    return { status: "error", message: `No se pudo actualizar: ${error.message}` };
  }
  if (!data) {
    return { status: "error", message: "No se encontró el perfil indicado." };
  }

  revalidatePath("/usuarios");
  return {
    status: "ok",
    message: `${data.full_name || "Perfil"} quedó ${data.is_active ? "activo" : "inactivo"}.`,
  };
}
