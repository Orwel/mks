"use client";

import { useState } from "react";

import { deleteContactMessage } from "@/app/(dashboard)/contacto/actions";

import {
  DASHBOARD_BTN_DANGER,
  DASHBOARD_TABLE,
  DASHBOARD_TABLE_HEAD,
  DASHBOARD_TABLE_WRAP,
} from "./dashboard-styles";
import { DashboardModal } from "./dashboard-modal";

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export function ContactMessagesAdmin({ messages }: { messages: ContactMessageRow[] }) {
  const [selected, setSelected] = useState<ContactMessageRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const close = () => setSelected(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este mensaje de contacto?")) return;
    setDeleting(true);
    await deleteContactMessage(id);
    setDeleting(false);
    close();
  };

  return (
    <>
      {messages.length === 0 ? (
        <p className="rounded-xl border-4 border-dashed border-[var(--mks-ink)] bg-white p-6 text-sm text-neutral-600">
          Aún no hay mensajes de contacto. Cuando los usuarios envíen el formulario en{" "}
          <code className="font-mono text-xs">/contactanos</code>, aparecerán aquí.
        </p>
      ) : (
        <div className={DASHBOARD_TABLE_WRAP}>
          <table className={DASHBOARD_TABLE}>
            <thead className={DASHBOARD_TABLE_HEAD}>
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Mensaje</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="border-b border-neutral-200">
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3">
                    <a href={`mailto:${m.email}`} className="text-[var(--mks-cyan)] hover:underline">
                      {m.email}
                    </a>
                  </td>
                  <td className="max-w-xs truncate p-3 text-neutral-700">{m.message}</td>
                  <td className="p-3 text-xs text-neutral-600">
                    {new Date(m.created_at).toLocaleString("es-CO")}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="rounded-lg border-2 border-[var(--mks-ink)] px-3 py-1.5 text-xs font-black text-[var(--mks-ink)] hover:bg-[var(--mks-cream)]"
                      onClick={() => setSelected(m)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DashboardModal open={!!selected} onClose={close} title="Mensaje de contacto">
        {selected ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">Nombre</p>
              <p className="font-medium">{selected.name}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">Correo</p>
              <a href={`mailto:${selected.email}`} className="font-medium text-[var(--mks-cyan)] hover:underline">
                {selected.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">Fecha</p>
              <p>{new Date(selected.created_at).toLocaleString("es-CO")}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">Mensaje</p>
              <p className="whitespace-pre-wrap leading-relaxed text-neutral-800">{selected.message}</p>
            </div>
            <button
              type="button"
              className={DASHBOARD_BTN_DANGER}
              disabled={deleting}
              onClick={() => handleDelete(selected.id)}
            >
              {deleting ? "Eliminando…" : "Eliminar mensaje"}
            </button>
          </div>
        ) : null}
      </DashboardModal>
    </>
  );
}
