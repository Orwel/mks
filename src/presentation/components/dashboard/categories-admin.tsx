"use client";

import { useMemo, useState } from "react";

import {
  createCategory,
  deleteCategoryForm,
  reorderCategories,
  updateCategory,
} from "@/app/(dashboard)/categorias/actions";

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

export type CategoryAdminRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
  parent_id: string | null;
};

type Modal = "create" | "edit" | "delete" | null;

function CategoryFormFields({
  category,
  roots,
  isCreate,
}: {
  category?: CategoryAdminRow;
  roots: CategoryAdminRow[];
  isCreate?: boolean;
}) {
  return (
    <>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        Categoría padre
        <select
          name="parent_id"
          className={DASHBOARD_FIELD}
          defaultValue={category?.parent_id ?? ""}
          disabled={!!category && !category.parent_id}
        >
          <option value="">— Raíz (categoría principal) —</option>
          {roots.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Nombre
        <input name="name" required defaultValue={category?.name} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Slug {category ? "" : "(opcional)"}
        <input
          name="slug"
          required={!!category}
          defaultValue={category?.slug}
          placeholder={category ? undefined : "auto desde nombre"}
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        Descripción
        <textarea
          name="description"
          rows={2}
          defaultValue={category?.description ?? ""}
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        Imagen URL
        <input name="image_url" defaultValue={category?.image_url ?? ""} className={DASHBOARD_FIELD} />
      </label>
      {isCreate ? (
        <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600 md:col-span-2">
          <input name="create_general" type="checkbox" defaultChecked className="size-4 border-2 border-[var(--mks-ink)]" />
          Crear subcategoría &quot;General&quot; (recomendado para raíz)
        </label>
      ) : null}
      <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600 md:col-span-2">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={category?.is_active ?? true}
          className="size-4 border-2 border-[var(--mks-ink)]"
        />
        Activa
      </label>
    </>
  );
}

function buildTreeRows(categories: CategoryAdminRow[]) {
  const roots = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const byParent = new Map<string, CategoryAdminRow[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const list = byParent.get(c.parent_id) ?? [];
    list.push(c);
    byParent.set(c.parent_id, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }
  const rows: { category: CategoryAdminRow; depth: number }[] = [];
  for (const root of roots) {
    rows.push({ category: root, depth: 0 });
    for (const child of byParent.get(root.id) ?? []) {
      rows.push({ category: child, depth: 1 });
    }
  }
  return { rows, roots };
}

export function CategoriesAdmin({ categories }: { categories: CategoryAdminRow[] }) {
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<CategoryAdminRow | null>(null);
  const { rows, roots } = useMemo(() => buildTreeRows(categories), [categories]);
  const initialItems = useMemo(() => rows.map((r) => r.category), [rows]);
  const { items, isPending, rowDragProps, handleDragProps } = useSortableReorder(
    initialItems,
    reorderCategories,
  );

  const itemRows = useMemo(() => {
    const byId = new Map(items.map((c) => [c.id, c]));
    return rows.map((r) => ({ ...r, category: byId.get(r.category.id) ?? r.category }));
  }, [items, rows]);

  const close = () => {
    setModal(null);
    setSelected(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-600">
          Raíz → subcategoría (máx. 2 niveles). Productos solo en subcategorías.
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
          Nueva categoría
        </button>
      </div>

      <div className={`${DASHBOARD_TABLE_WRAP} mt-4`}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="w-10 p-3" aria-label="Orden" />
              <th className="p-3">Nombre</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Nivel</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {itemRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-neutral-600">
                  No hay categorías registradas.
                </td>
              </tr>
            ) : (
              itemRows.map((row, index) => (
                <tr key={row.category.id} {...rowDragProps(index, "border-b border-neutral-200")}>
                  <td className="p-3">
                    <SortableDragHandle dragHandleProps={handleDragProps(index)} />
                  </td>
                  <td className="p-3 font-bold" style={{ paddingLeft: 12 + row.depth * 20 }}>
                    {row.depth > 0 ? "↳ " : ""}
                    {row.category.name}
                  </td>
                  <td className="p-3 font-mono text-xs">{row.category.slug}</td>
                  <td className="p-3 text-xs uppercase">{row.depth === 0 ? "Raíz" : "Sub"}</td>
                  <td className="p-3 text-xs font-bold uppercase">
                    {row.category.is_active ? "Activa" : "Inactiva"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(row.category);
                          setModal("edit");
                        }}
                        className={DASHBOARD_BTN_GHOST}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(row.category);
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

      <DashboardModal open={modal === "create"} onClose={close} title="Nueva categoría" wide>
        <form action={createCategory} className="grid gap-3 md:grid-cols-2">
          <CategoryFormFields roots={roots} isCreate />
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

      <DashboardModal open={modal === "edit" && !!selected} onClose={close} title="Editar categoría" wide>
        {selected ? (
          <form action={updateCategory.bind(null, selected.id)} className="grid gap-3 md:grid-cols-2">
            <CategoryFormFields category={selected} roots={roots.filter((r) => r.id !== selected.id)} />
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

      <DashboardModal open={modal === "delete" && !!selected} onClose={close} title="Eliminar categoría">
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              ¿Eliminar <strong>{selected.name}</strong>? Los productos vinculados pueden verse afectados.
            </p>
            <form action={deleteCategoryForm} className="flex gap-2">
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
