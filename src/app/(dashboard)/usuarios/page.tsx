import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { USER_ROLES, type UserRole } from "@/core/value-objects/user-role";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

import { updateProfileRoleForm } from "./actions";

const field =
  "mt-1 w-full rounded-lg border-2 border-[var(--mks-ink)] bg-white px-2 py-1.5 text-sm font-medium text-[var(--mks-ink)]";

type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export default async function DashboardUsuariosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false });

  const rows = (profiles ?? []) as ProfileRow[];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Usuarios"
        description="Perfiles y roles. Solo administradores pueden mutar roles (trigger y RLS en Supabase)."
      />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}

      <div className="overflow-x-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white shadow-[8px_8px_0_0_var(--mks-ink)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] font-black uppercase tracking-wide text-[var(--mks-ink)]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Activo</th>
              <th className="p-3">Guardar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-neutral-200 align-top">
                <td className="p-3">
                  <p className="font-bold">{p.full_name || "—"}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-neutral-500">{p.id}</p>
                </td>
                <td className="p-3" colSpan={3}>
                  <form action={updateProfileRoleForm} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="user_id" value={p.id} />
                    <label className="text-xs font-bold text-neutral-600">
                      Rol
                      <select name="role" defaultValue={p.role} className={field}>
                        {USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="rounded-lg border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-3 py-1.5 text-xs font-black text-[var(--mks-ink)]"
                    >
                      Actualizar rol
                    </button>
                  </form>
                  <p className="mt-2 text-xs text-neutral-500">Cuenta activa: {p.is_active ? "sí" : "no"}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
