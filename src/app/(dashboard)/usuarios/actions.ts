"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { UserRole } from "@/core/value-objects/user-role";
import { USER_ROLES } from "@/core/value-objects/user-role";

function isUserRole(s: string): s is UserRole {
  return (USER_ROLES as readonly string[]).includes(s);
}

export async function updateProfileRole(userId: string, role: string): Promise<void> {
  if (!isUserRole(role)) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) {
    console.error("[updateProfileRole]", error.message);
    return;
  }
  revalidatePath("/usuarios");
}

export async function updateProfileRoleForm(formData: FormData): Promise<void> {
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId) return;
  await updateProfileRole(userId, role);
}
