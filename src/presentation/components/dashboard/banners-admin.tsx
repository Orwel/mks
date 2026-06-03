"use client";

import { useState } from "react";

import {
  createBanner,
  deleteBannerForm,
  updateBanner,
} from "@/app/(dashboard)/banners/actions";

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

export type BannerAdminRow = {
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

function BannerFormFields({ banner }: { banner?: BannerAdminRow }) {
  return (
    <>
      <label className="text-xs font-black uppercase text-neutral-600">
        Título
        <input name="title" defaultValue={banner?.title ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Subtítulo
        <input name="subtitle" defaultValue={banner?.subtitle ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <DashboardStorageImagesField
        required={!banner}
        hint={
          banner
            ? "Sube imágenes nuevas para ampliar la galería. Las existentes se conservan."
            : "Al menos una imagen en el bucket banners. Varias imágenes = galería navegable."
        }
      />
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        URL enlace
        <input name="link_url" defaultValue={banner?.link_url ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Posición
        <select name="position" defaultValue={banner?.position ?? "hero"} className={DASHBOARD_FIELD}>
          <option value="hero">Contenido destacado (panel del hero)</option>
          <option value="secondary">Galería inferior</option>
          <option value="sidebar">Sidebar (próximamente)</option>
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Orden
        <input
          name="sort_order"
          type="number"
          defaultValue={banner?.sort_order ?? 0}
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Inicio (ISO opcional)
        <input
          name="starts_at"
          defaultValue={banner?.starts_at ?? ""}
          placeholder="2026-01-01T00:00:00Z"
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Fin (ISO opcional)
        <input name="ends_at" defaultValue={banner?.ends_at ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600 md:col-span-2">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={banner?.is_active ?? true}
          className="size-4 border-2 border-[var(--mks-ink)]"
        />
        Activo
      </label>
    </>
  );
}

export function BannersAdmin({ banners }: { banners: BannerAdminRow[] }) {
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<BannerAdminRow | null>(null);

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
          Nuevo banner
        </button>
      </div>

      <div className={`${DASHBOARD_TABLE_WRAP} mt-4`}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="p-3">Título</th>
              <th className="p-3">Posición</th>
              <th className="p-3">Orden</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-neutral-600">
                  No hay banners configurados.
                </td>
              </tr>
            ) : (
              banners.map((b) => (
                <tr key={b.id} className="border-b border-neutral-200">
                  <td className="p-3">
                    <p className="font-bold">{b.title || "—"}</p>
                    {b.subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{b.subtitle}</p> : null}
                  </td>
                  <td className="p-3 text-xs font-bold uppercase">{b.position}</td>
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

      <DashboardModal open={modal === "create"} onClose={close} title="Nuevo banner" wide>
        <form action={createBanner} className="grid gap-3 md:grid-cols-2">
          <BannerFormFields />
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

      <DashboardModal open={modal === "edit" && !!selected} onClose={close} title="Editar banner" wide>
        {selected ? (
          <form action={updateBanner.bind(null, selected.id)} className="grid gap-3 md:grid-cols-2">
            <BannerFormFields banner={selected} />
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

      <DashboardModal open={modal === "delete" && !!selected} onClose={close} title="Eliminar banner">
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              ¿Eliminar el banner <strong>{selected.title || selected.id}</strong>?
            </p>
            <form action={deleteBannerForm} className="flex gap-2">
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
