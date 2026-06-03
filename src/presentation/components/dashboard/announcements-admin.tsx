"use client";

import { useState } from "react";

import {
  createAnnouncement,
  deleteAnnouncementForm,
  updateAnnouncement,
} from "@/app/(dashboard)/anuncios/actions";

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

export type AnnouncementAdminRow = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  display_mode: "modal" | "toast" | "bar";
  frequency: "once_per_session" | "once_per_user" | "always";
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type Modal = "create" | "edit" | "delete" | null;

function AnnouncementFormFields({ item }: { item?: AnnouncementAdminRow }) {
  return (
    <>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        Título
        <input name="title" required defaultValue={item?.title} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        Cuerpo
        <textarea name="body" required rows={4} defaultValue={item?.body} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        Imagen URL
        <input name="image_url" defaultValue={item?.image_url ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        CTA etiqueta
        <input name="cta_label" defaultValue={item?.cta_label ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        CTA URL
        <input name="cta_url" defaultValue={item?.cta_url ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Tipo de aviso
        <select name="display_mode" defaultValue={item?.display_mode ?? "modal"} className={DASHBOARD_FIELD}>
          <option value="modal">Pop-up (modal)</option>
          <option value="toast">Toast (esquina)</option>
          <option value="bar">Barra inferior</option>
        </select>
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
        Frecuencia
        <select name="frequency" defaultValue={item?.frequency ?? "once_per_session"} className={DASHBOARD_FIELD}>
          <option value="once_per_session">Una vez por sesión</option>
          <option value="once_per_user">Una vez por visitante</option>
          <option value="always">Siempre al ingresar</option>
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Inicio (ISO)
        <input name="starts_at" defaultValue={item?.starts_at ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Fin (ISO)
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

export function AnnouncementsAdmin({ items }: { items: AnnouncementAdminRow[] }) {
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<AnnouncementAdminRow | null>(null);

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
          Nuevo anuncio pop-up
        </button>
      </div>

      <div className={`${DASHBOARD_TABLE_WRAP} mt-4`}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="p-3">Título</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Prioridad</th>
              <th className="p-3">Frecuencia</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-neutral-600">
                  No hay anuncios pop-up configurados.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-b border-neutral-200">
                  <td className="p-3">
                    <p className="font-bold">{a.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{a.body}</p>
                  </td>
                  <td className="p-3 text-xs font-bold uppercase">{a.display_mode}</td>
                  <td className="p-3">{a.sort_order}</td>
                  <td className="p-3 text-xs">{a.frequency}</td>
                  <td className="p-3 text-xs font-bold uppercase">{a.is_active ? "Activo" : "Inactivo"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(a);
                          setModal("edit");
                        }}
                        className={DASHBOARD_BTN_GHOST}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(a);
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

      <DashboardModal open={modal === "create"} onClose={close} title="Nuevo anuncio" wide>
        <form action={createAnnouncement} className="grid gap-3 md:grid-cols-2">
          <AnnouncementFormFields />
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

      <DashboardModal open={modal === "edit" && !!selected} onClose={close} title="Editar anuncio" wide>
        {selected ? (
          <form action={updateAnnouncement.bind(null, selected.id)} className="grid gap-3 md:grid-cols-2">
            <AnnouncementFormFields item={selected} />
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

      <DashboardModal open={modal === "delete" && !!selected} onClose={close} title="Eliminar anuncio">
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              ¿Eliminar el anuncio <strong>{selected.title}</strong>?
            </p>
            <form action={deleteAnnouncementForm} className="flex gap-2">
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
