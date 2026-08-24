"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createDestacado,
  deleteDestacadoForm,
  updateDestacadoForForm,
  type DestacadoFormState,
} from "@/app/(dashboard)/destacados/actions";

const initialFormState: DestacadoFormState = { ok: true };

import { DashboardStorageImagesField } from "./dashboard-storage-images-field";
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

export type DestacadoAdminRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  position: "hero" | "secondary" | "sidebar";
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type Modal = "create" | "edit" | "delete" | null;

function FormFeedback({ state }: { state: DestacadoFormState }) {
  if (!state.message) return null;
  return (
    <p
      className={`md:col-span-2 text-sm font-bold ${state.ok ? "text-emerald-700" : "text-[var(--mks-pink)]"}`}
      role="status"
    >
      {state.message}
    </p>
  );
}

function DestacadoFormFields({ item }: { item?: DestacadoAdminRow }) {
  return (
    <>
      <label className="text-xs font-black uppercase text-neutral-600">
        Título
        <input name="title" defaultValue={item?.title ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Subtítulo
        <input name="subtitle" defaultValue={item?.subtitle ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <DashboardStorageImagesField
        required={!item}
        hint={
          item
            ? "Sube imágenes nuevas para ampliar la galería. Las existentes se conservan."
            : "Al menos una imagen. Puedes subir varias para la galería del destacado."
        }
      />
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        URL enlace (opcional)
        <input name="link_url" defaultValue={item?.link_url ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Prioridad (menor = primero)
        <input
          name="sort_order"
          type="number"
          defaultValue={item?.sort_order ?? 0}
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Inicio (ISO opcional)
        <input
          name="starts_at"
          defaultValue={item?.starts_at ?? ""}
          placeholder="2026-01-01T00:00:00Z"
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Fin (ISO opcional)
        <input name="ends_at" defaultValue={item?.ends_at ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600 md:col-span-2">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={item?.is_active ?? true}
          className="size-4 border-2 border-[var(--mks-ink)]"
        />
        Activo
      </label>
    </>
  );
}

function EditDestacadoForm({
  item,
  onSaved,
}: {
  item: DestacadoAdminRow;
  onSaved: () => void;
}) {
  const [editState, editAction, editPending] = useActionState(
    updateDestacadoForForm.bind(null, item.id),
    initialFormState,
  );

  useEffect(() => {
    if (editState.ok && editState.message) {
      onSaved();
    }
  }, [editState, onSaved]);

  return (
    <form action={editAction} className="grid gap-3 md:grid-cols-2">
      <DestacadoFormFields item={item} />
      <FormFeedback state={editState} />
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={editPending} className={DASHBOARD_BTN_PRIMARY}>
          {editPending ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onSaved} className={DASHBOARD_BTN_GHOST}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function DestacadosAdmin({ items }: { items: DestacadoAdminRow[] }) {
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<DestacadoAdminRow | null>(null);
  const [createState, createAction, createPending] = useActionState(createDestacado, initialFormState);

  // Cerrar el modal cuando la acción termina bien. Se resuelve durante el
  // render comparando la identidad del estado de la acción, en vez de con un
  // efecto que encadenaba un render adicional con el modal aún visible.
  const [syncedCreateState, setSyncedCreateState] = useState(createState);
  if (syncedCreateState !== createState) {
    setSyncedCreateState(createState);
    if (createState.ok && createState.message && modal === "create") {
      setModal(null);
      setSelected(null);
    }
  }

  const close = () => {
    setModal(null);
    setSelected(null);
  };

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setModal("create");
          }}
          className={DASHBOARD_BTN_PRIMARY}
        >
          Nuevo destacado
        </button>
      </div>

      <div className={`${DASHBOARD_TABLE_WRAP} mt-4`}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="p-3">Título</th>
              <th className="p-3">Prioridad</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-neutral-600">
                  No hay destacados configurados. Se muestran en el panel del hero de la portada.
                </td>
              </tr>
            ) : (
              items.map((b) => (
                <tr key={b.id} className="border-b border-neutral-200">
                  <td className="p-3">
                    <p className="font-bold">{b.title || "—"}</p>
                    {b.subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{b.subtitle}</p> : null}
                  </td>
                  <td className="p-3">{b.sort_order}</td>
                  <td className="p-3 text-xs font-bold uppercase">{b.is_active ? "Activo" : "Inactivo"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(b);
                          setModal("edit");
                        }}
                        className={DASHBOARD_BTN_GHOST}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(b);
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

      <DashboardModal open={modal === "create"} onClose={close} title="Nuevo destacado" wide>
        <form action={createAction} className="grid gap-3 md:grid-cols-2">
          <DestacadoFormFields />
          <FormFeedback state={createState} />
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" disabled={createPending} className={DASHBOARD_BTN_PRIMARY}>
              {createPending ? "Creando…" : "Crear"}
            </button>
            <button type="button" onClick={close} className={DASHBOARD_BTN_GHOST}>
              Cancelar
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal open={modal === "edit" && !!selected} onClose={close} title="Editar destacado" wide>
        {selected ? <EditDestacadoForm key={selected.id} item={selected} onSaved={close} /> : null}
      </DashboardModal>

      <DashboardModal open={modal === "delete" && !!selected} onClose={close} title="Eliminar destacado">
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              ¿Eliminar el destacado <strong>{selected.title || selected.id}</strong>?
            </p>
            <form action={deleteDestacadoForm} className="flex gap-2">
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
