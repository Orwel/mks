import "server-only";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { UserRole } from "@/core/value-objects/user-role";
import { isAdminRole, isStaffRole } from "@/core/value-objects/user-role";

import { createSupabaseServerClient } from "./server";

export type AuthProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone: string | null;
};

export type CurrentSession = {
  user: User;
  profile: AuthProfile;
};

const loadSession = cache(async (): Promise<CurrentSession | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return {
    user,
    profile: {
      id: profile.id as string,
      full_name: (profile.full_name as string) ?? "",
      role: profile.role as UserRole,
      is_active: profile.is_active as boolean,
      phone: (profile.phone as string) ?? null,
    },
  };
});

/** Usuario autenticado + fila `profiles` (una lectura por request, deduplicada). */
export async function getCurrentUser(): Promise<CurrentSession | null> {
  return loadSession();
}

/** Redirige a `/login` si no hay sesión. `nextAfterLogin` se pasa como query `next`. */
export async function requireAuth(nextAfterLogin = "/mi-cuenta"): Promise<CurrentSession> {
  const session = await getCurrentUser();
  if (!session) {
    const safe =
      nextAfterLogin.startsWith("/") && !nextAfterLogin.startsWith("//")
        ? nextAfterLogin
        : "/mi-cuenta";
    redirect(`/login?next=${encodeURIComponent(safe)}`);
  }
  return session;
}

/** Solo `admin` o `employee` activos; resto → login. */
export async function requireStaff(): Promise<CurrentSession> {
  const session = await requireAuth("/dashboard");
  if (!isStaffRole(session.profile.role)) {
    redirect("/login?error=no_staff");
  }
  if (!session.profile.is_active) {
    redirect("/login?error=cuenta_inactiva");
  }
  return session;
}

/**
 * Solo administradores activos (panel `/dashboard` y rutas hermanas).
 * Clientes u empleados autenticados → `/mi-cuenta` con aviso (no filtrar solo por UI: alinear RLS con `is_admin()`).
 */
export async function requireAdmin(): Promise<CurrentSession> {
  const session = await requireAuth("/dashboard");
  if (!session.profile.is_active) {
    redirect("/login?error=cuenta_inactiva");
  }
  if (!isAdminRole(session.profile.role)) {
    redirect("/mi-cuenta?error=no_admin");
  }
  return session;
}

/** Sesión con uno de los roles permitidos. */
export async function requireRole(
  allowed: readonly UserRole[],
  nextAfterLogin = "/",
): Promise<CurrentSession> {
  const session = await requireAuth(nextAfterLogin);
  if (!allowed.includes(session.profile.role)) {
    redirect("/");
  }
  if (!session.profile.is_active && session.profile.role !== "customer") {
    redirect("/login?error=cuenta_inactiva");
  }
  return session;
}
