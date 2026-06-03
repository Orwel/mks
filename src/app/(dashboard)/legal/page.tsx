import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

import { createLegalDocument, publishLegalDocumentForm } from "./actions";

const field =
  "mt-1 w-full rounded-lg border-2 border-[var(--mks-ink)] bg-white px-2 py-1.5 text-sm font-medium text-[var(--mks-ink)]";

type LegalRow = {
  id: string;
  type: "terms" | "privacy";
  version: string;
  is_current: boolean;
  published_at: string;
};

export default async function DashboardLegalPage() {
  const supabase = await createSupabaseServerClient();
  const { data: docs, error } = await supabase
    .from("legal_documents")
    .select("id, type, version, is_current, published_at")
    .order("published_at", { ascending: false });

  const rows = (docs ?? []) as LegalRow[];

  return (
    <div className="space-y-10">
      <DashboardPageHeader
        title="Legal"
        description="Versiones de términos y privacidad. Publicar marca una versión como vigente por tipo (ADR 0005)."
      />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}

      <section className="rounded-xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[8px_8px_0_0_var(--mks-ink)]">
        <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Nueva versión (borrador)</h2>
        <form action={createLegalDocument} className="mt-4 grid gap-3">
          <label className="text-xs font-black uppercase text-neutral-600">
            Tipo
            <select name="type" className={field} defaultValue="terms">
              <option value="terms">Términos</option>
              <option value="privacy">Privacidad</option>
            </select>
          </label>
          <label className="text-xs font-black uppercase text-neutral-600">
            Versión (semver)
            <input name="version" required placeholder="1.1.0" className={field} />
          </label>
          <label className="text-xs font-black uppercase text-neutral-600">
            Contenido (markdown / texto plano)
            <textarea name="content" required rows={12} className={field} />
          </label>
          <button
            type="submit"
            className="w-fit rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-4 py-2 text-sm font-black text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]"
          >
            Guardar borrador
          </button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white shadow-[8px_8px_0_0_var(--mks-ink)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] font-black uppercase tracking-wide text-[var(--mks-ink)]">
            <tr>
              <th className="p-3">Tipo</th>
              <th className="p-3">Versión</th>
              <th className="p-3">Vigente</th>
              <th className="p-3">Publicado</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-neutral-200">
                <td className="p-3 font-bold uppercase">{d.type}</td>
                <td className="p-3 font-mono text-xs">{d.version}</td>
                <td className="p-3">{d.is_current ? "Sí" : "No"}</td>
                <td className="p-3 text-xs text-neutral-600">
                  {new Date(d.published_at).toLocaleString("es-CO")}
                </td>
                <td className="p-3">
                  {d.is_current ? (
                    <span className="text-xs font-bold text-neutral-400">Ya vigente</span>
                  ) : (
                    <form action={publishLegalDocumentForm} className="inline">
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        className="rounded-lg border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-3 py-1.5 text-xs font-black text-white shadow-[3px_3px_0_0_var(--mks-ink)]"
                      >
                        Publicar
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
