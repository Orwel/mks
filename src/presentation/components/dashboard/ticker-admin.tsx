"use client";

import { useState } from "react";

import {
  createTicker,
  deleteTickerForm,
  reorderTickerMessages,
  updateTicker,
} from "@/app/(dashboard)/ticker/actions";

import { DashboardModal } from "./dashboard-modal";
import {
  DASHBOARD_BTN_DANGER,
  DASHBOARD_BTN_GHOST,
  DASHBOARD_BTN_PRIMARY,
  DASHBOARD_FIELD,
  DASHBOARD_TABLE,
  DASHBOARD_TABLE_HEAD,
  DASHBOARD_TABLE_WRAP,
} from "./dashboard-styles";
import { SortableDragHandle } from "./sortable-drag-handle";
import { useSortableReorder } from "./use-sortable-reorder";

export type TickerAdminRow = {
  id: string;
  message: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type Modal = "create" | "edit" | "delete" | null;

function TickerFormFields({ row }: { row?: TickerAdminRow }) {
  return (
    <>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        Mensaje
        <input name="message" required defaultValue={row?.message} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        URL enlace
        <input name="link_url" defaultValue={row?.link_url ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Inicio (ISO)
        <input name="starts_at" defaultValue={row?.starts_at ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Fin (ISO)
        <input name="ends_at" defaultValue={row?.ends_at ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600 md:col-span-2">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={row?.is_active ?? true}
          className="size-4 border-2 border-[var(--mks-ink)]"
        />
        Activo
      </label>
    </>
  );
}

export function TickerAdmin({ messages }: { messages: TickerAdminRow[] }) {
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<TickerAdminRow | null>(null);
  const { items, isPending, rowDragProps, handleDragProps } = useSortableReorder(
    messages,
    reorderTickerMessages,
  );

  const close = () => {
    setModal(null);
    setSelected(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-600">
          Arrastra las filas para el orden del ticker en la página principal.
          {isPending ? " Guardando orden…" : null}
        </p>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setModal("create");
          }}
          className={DASHBOARD_BTN_PRIMARY}
        >
          Nuevo mensaje
        </button>
      </div>

      <div className={`${DASHBOARD_TABLE_WRAP} mt-4`}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="w-10 p-3" aria-label="Orden" />
              <th className="p-3">Mensaje</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-neutral-600">
                  No hay mensajes en el ticker.
                </td>
              </tr>
            ) : (
              items.map((t, index) => (
                <tr key={t.id} {...rowDragProps(index, "border-b border-neutral-200")}>
                  <td className="p-3">
                    <SortableDragHandle dragHandleProps={handleDragProps(index)} />
                  </td>
                  <td className="max-w-md p-3">
                    <p className="line-clamp-2 font-medium">{t.message}</p>
                    {t.link_url ? (
                      <p className="mt-0.5 truncate font-mono text-[0.65rem] text-neutral-500">{t.link_url}</p>
                    ) : null}
                  </td>
                  <td className="p-3 text-xs font-bold uppercase">{t.is_active ? "Activo" : "Inactivo"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(t);
                          setModal("edit");
                        }}
                        className={DASHBOARD_BTN_GHOST}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(t);
                          setModal("delete");
                        }}
                        className={DASHBOARD_BTN_DANGER}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DashboardModal open={modal === "create"} onClose={close} title="Nuevo mensaje" wide>
        <form action={createTicker} className="grid gap-3 md:grid-cols-2">
          <TickerFormFields />
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className={DASHBOARD_BTN_PRIMARY}>
              Crear
            </button>
            <button type="button" onClick={close} className={DASHBOARD_BTN_GHOST}>
              Cancelar
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal open={modal === "edit" && !!selected} onClose={close} title="Editar mensaje" wide>
        {selected ? (
          <form action={updateTicker.bind(null, selected.id)} className="grid gap-3 md:grid-cols-2">
            <TickerFormFields row={selected} />
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className={DASHBOARD_BTN_PRIMARY}>
                Guardar
              </button>
              <button type="button" onClick={close} className={DASHBOARD_BTN_GHOST}>
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </DashboardModal>

      <DashboardModal open={modal === "delete" && !!selected} onClose={close} title="Eliminar mensaje">
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700 line-clamp-3">
              ¿Eliminar el mensaje «{selected.message}»?
            </p>
            <form action={deleteTickerForm} className="flex gap-2">
              <input type="hidden" name="id" value={selected.id} />
              <button type="submit" className={DASHBOARD_BTN_DANGER}>
                Sí, eliminar
              </button>
              <button type="button" onClick={close} className={DASHBOARD_BTN_GHOST}>
                Cancelar
              </button>
            </form>
          </div>
        ) : null}
      </DashboardModal>
    </>
  );
}
