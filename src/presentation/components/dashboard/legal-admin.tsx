"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  createLegalDocument,
  legalInitialState,
  publishLegalDocument,
  updateLegalDraft,
} from "@/app/(dashboard)/legal/actions";

const field =
  "mt-1 w-full rounded-lg border-2 border-[var(--mks-ink)] bg-white px-2 py-1.5 text-sm font-medium text-[var(--mks-ink)]";

export type LegalRow = {
  id: string;
  type: "terms" | "privacy";
  version: string;
  title: string;
  content: string;
  is_current: boolean;
  published_at: string;
  effective_date: string | null;
};

const TYPE_LABEL: Record<LegalRow["type"], string> = {
  terms: "Términos y condiciones",
  privacy: "Política de privacidad",
};

const PUBLIC_ROUTE: Record<LegalRow["type"], string> = {
  terms: "/terminos",
  privacy: "/privacidad",
};

function Feedback({ state }: { state: { status: string; message: string } }) {
  if (state.status === "idle") return null;
  return (
    <p
      role="status"
      className={
        state.status === "ok"
          ? "text-sm font-bold text-emerald-700"
          : "text-sm font-bold text-[var(--mks-pink)]"
      }
    >
      {state.message}
    </p>
  );
}

function NewVersionForm({ rows }: { rows: LegalRow[] }) {
  const [state, action, pending] = useActionState(createLegalDocument, legalInitialState);
  const [type, setType] = useState<LegalRow["type"]>("terms");

  // Precargar con el texto vigente: una versión nueva casi siempre es una
  // edición de la anterior, no un documento en blanco.
  const currentOfType = rows.find((r) => r.type === type && r.is_current);

  return (
    <section className="rounded-xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[8px_8px_0_0_var(--mks-ink)]">
      <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">
        Nueva versión (borrador)
      </h2>
      <p className="mt-1 text-xs text-neutral-600">
        La versión vigente no se edita nunca: quienes ya la aceptaron quedaron ligados a
        ese texto exacto. Para cambiar algo se crea una versión nueva y se publica.
      </p>

      <form action={action} className="mt-4 grid gap-3">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs font-black uppercase text-neutral-600">
            Tipo
            <select
              name="type"
              className={field}
              value={type}
              onChange={(e) => setType(e.target.value as LegalRow["type"])}
            >
              <option value="terms">Términos</option>
              <option value="privacy">Privacidad</option>
            </select>
          </label>
          <label className="text-xs font-black uppercase text-neutral-600">
            Versión (semver)
            <input name="version" required placeholder="1.1.0" className={field} />
          </label>
          <label className="text-xs font-black uppercase text-neutral-600">
            Vigente desde
            <input name="effective_date" type="date" className={field} />
          </label>
        </div>

        <label className="text-xs font-black uppercase text-neutral-600">
          Título
          <input
            name="title"
            key={`title-${type}`}
            defaultValue={currentOfType?.title ?? TYPE_LABEL[type]}
            className={field}
          />
        </label>

        <label className="text-xs font-black uppercase text-neutral-600">
          Contenido (markdown)
          <textarea
            name="content"
            key={`content-${type}`}
            defaultValue={currentOfType?.content ?? ""}
            required
            rows={16}
            className={`${field} font-mono text-xs`}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-4 py-2 text-sm font-black text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar borrador"}
          </button>
          <Feedback state={state} />
        </div>
      </form>
    </section>
  );
}

function DraftEditor({ row }: { row: LegalRow }) {
  const [state, action, pending] = useActionState(updateLegalDraft, legalInitialState);
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-black uppercase text-[var(--mks-ink)] underline"
      >
        {open ? "Cerrar edición" : "Editar borrador"}
      </button>
      {open ? (
        <form action={action} className="mt-3 grid gap-2">
          <input type="hidden" name="id" value={row.id} />
          <input name="title" defaultValue={row.title} className={field} />
          <input
            name="effective_date"
            type="date"
            defaultValue={row.effective_date ?? ""}
            className={field}
          />
          <textarea
            name="content"
            defaultValue={row.content}
            rows={14}
            className={`${field} font-mono text-xs`}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="w-fit rounded-lg border-4 border-[var(--mks-ink)] bg-[var(--mks-yellow)] px-3 py-1.5 text-xs font-black text-[var(--mks-ink)] disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
            <Feedback state={state} />
          </div>
        </form>
      ) : null}
    </div>
  );
}

function PublishButton({ row }: { row: LegalRow }) {
  const [state, action, pending] = useActionState(publishLegalDocument, legalInitialState);

  return (
    <div className="space-y-1">
      <form action={action}>
        <input type="hidden" name="id" value={row.id} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-3 py-1.5 text-xs font-black text-white shadow-[3px_3px_0_0_var(--mks-ink)] disabled:opacity-60"
        >
          {pending ? "Publicando…" : "Publicar"}
        </button>
      </form>
      <Feedback state={state} />
    </div>
  );
}

export function LegalAdmin({ rows }: { rows: LegalRow[] }) {
  return (
    <div className="space-y-10">
      <NewVersionForm rows={rows} />

      <section className="overflow-x-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white shadow-[8px_8px_0_0_var(--mks-ink)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] font-black uppercase tracking-wide text-[var(--mks-ink)]">
            <tr>
              <th className="p-3">Documento</th>
              <th className="p-3">Versión</th>
              <th className="p-3">Vigente</th>
              <th className="p-3">Publicado</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-600">
                  Todavía no hay documentos. Crea la primera versión arriba.
                </td>
              </tr>
            ) : null}
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-neutral-200 align-top">
                <td className="p-3">
                  <p className="font-bold">{TYPE_LABEL[d.type]}</p>
                  <p className="text-xs text-neutral-600">{d.title}</p>
                  {d.is_current ? (
                    <Link
                      href={PUBLIC_ROUTE[d.type]}
                      target="_blank"
                      className="text-xs font-black text-[var(--mks-pink)] underline"
                    >
                      Ver página pública
                    </Link>
                  ) : (
                    <DraftEditor row={d} />
                  )}
                </td>
                <td className="p-3 font-mono text-xs">{d.version}</td>
                <td className="p-3 font-bold">{d.is_current ? "Sí" : "No"}</td>
                <td className="p-3 text-xs text-neutral-600">
                  {new Date(d.published_at).toLocaleString("es-CO")}
                </td>
                <td className="p-3">
                  {d.is_current ? (
                    <span className="text-xs font-bold text-neutral-400">Ya vigente</span>
                  ) : (
                    <PublishButton row={d} />
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
