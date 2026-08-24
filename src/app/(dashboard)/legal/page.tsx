import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { requireAdmin } from "@/infrastructure/supabase/auth-session";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";
import { LegalAdmin, type LegalRow } from "@/presentation/components/dashboard/legal-admin";

type AcceptanceRow = {
  id: string;
  email: string;
  full_name: string | null;
  source: string;
  accepted_at: string;
  terms_version: string | null;
  privacy_version: string | null;
  marketing_opt_in: boolean;
  ip_address: string | null;
  user_agent: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  registration: "Registro",
  checkout: "Compra",
  account_update: "Actualización",
};

export default async function DashboardLegalPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ data: docs, error }, { data: acceptances }] = await Promise.all([
    supabase
      .from("legal_documents")
      .select("id, type, version, title, content, is_current, published_at, effective_date")
      .order("is_current", { ascending: false })
      .order("published_at", { ascending: false }),
    supabase
      .from("legal_acceptances_detailed")
      .select(
        "id, email, full_name, source, accepted_at, terms_version, privacy_version, marketing_opt_in, ip_address, user_agent",
      )
      .order("accepted_at", { ascending: false })
      .limit(100),
  ]);

  const rows = (docs ?? []) as LegalRow[];
  const evidence = (acceptances ?? []) as AcceptanceRow[];

  return (
    <div className="space-y-10">
      <DashboardPageHeader
        title="Legal"
        description="Fuente única de verdad de los Términos y de la Política de privacidad. La web pública, el registro y el checkout leen la versión vigente desde aquí (ADR 0005)."
      />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}

      <LegalAdmin rows={rows} />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">
          Trazabilidad de aceptaciones
        </h2>
        <p className="text-xs text-neutral-600">
          Prueba de la autorización previa, expresa e informada: versión exacta aceptada,
          fecha, IP y dispositivo. Últimos 100 registros.
        </p>
        <div className="overflow-x-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white shadow-[8px_8px_0_0_var(--mks-ink)]">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] font-black uppercase tracking-wide text-[var(--mks-ink)]">
              <tr>
                <th className="p-3">Titular</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">T&amp;C</th>
                <th className="p-3">Privacidad</th>
                <th className="p-3">Marketing</th>
                <th className="p-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {evidence.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-neutral-600">
                    Todavía no hay aceptaciones registradas.
                  </td>
                </tr>
              ) : null}
              {evidence.map((a) => (
                <tr key={a.id} className="border-b border-neutral-200 align-top">
                  <td className="p-3">
                    <p className="font-bold">{a.full_name || "—"}</p>
                    <p className="text-xs text-neutral-600">{a.email}</p>
                  </td>
                  <td className="p-3 text-xs font-bold uppercase">
                    {SOURCE_LABEL[a.source] ?? a.source}
                  </td>
                  <td className="p-3 text-xs text-neutral-600">
                    {new Date(a.accepted_at).toLocaleString("es-CO")}
                  </td>
                  <td className="p-3 font-mono text-xs">{a.terms_version ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{a.privacy_version ?? "—"}</td>
                  <td className="p-3 text-xs">{a.marketing_opt_in ? "Sí" : "No"}</td>
                  <td className="p-3 font-mono text-[0.65rem] text-neutral-500">
                    <p>{a.ip_address ?? "—"}</p>
                    <p className="max-w-[220px] truncate" title={a.user_agent ?? undefined}>
                      {a.user_agent ?? ""}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
