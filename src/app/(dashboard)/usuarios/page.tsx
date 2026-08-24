import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { requireAdmin } from "@/infrastructure/supabase/auth-session";
import type { UserRole } from "@/core/value-objects/user-role";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";
import { UserRoleRow } from "@/presentation/components/dashboard/user-role-row";

type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

/** Correos desde `auth.users`: sólo accesible con service_role. */
async function loadEmails(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of data?.users ?? []) {
      if (u.email) map.set(u.id, u.email);
    }
  } catch {
    // Sin SUPABASE_SERVICE_ROLE_KEY el panel sigue funcionando, sin correos.
  }
  return map;
}

export default async function DashboardUsuariosPage() {
  const session = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ data: profiles, error }, emails] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, is_active, created_at")
      .order("created_at", { ascending: false }),
    loadEmails(),
  ]);

  const rows = (profiles ?? []) as ProfileRow[];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Usuarios"
        description="Perfiles y roles. El cambio de rol se ejecuta en el servidor previa verificación de administrador y queda registrado en la auditoría."
      />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}

      <div className="overflow-x-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white shadow-[8px_8px_0_0_var(--mks-ink)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] font-black uppercase tracking-wide text-[var(--mks-ink)]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Rol y estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-neutral-200 align-top">
                <td className="p-3">
                  <p className="font-bold">{p.full_name || "—"}</p>
                  {emails.get(p.id) ? (
                    <p className="text-xs text-neutral-600">{emails.get(p.id)}</p>
                  ) : null}
                  <p className="mt-1 font-mono text-[0.65rem] text-neutral-500">{p.id}</p>
                </td>
                <td className="p-3">
                  <UserRoleRow
                    userId={p.id}
                    role={p.role}
                    isActive={p.is_active}
                    isSelf={p.id === session.profile.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
