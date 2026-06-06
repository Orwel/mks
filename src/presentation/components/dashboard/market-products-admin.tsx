"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import {
  createProductDraft,
  discardProductDraft,
  deleteProductForm,
  finalizeProductFromDraft,
  updateProductForForm,
  type ProductFormState,
} from "@/app/(dashboard)/mercados/[code]/productos/actions";
import type { MarketProductAdminRow } from "@/infrastructure/supabase/queries/product-versions";
import { formatMoney } from "@/shared/lib/format-money";

import {
  categoryPathLabel,
  parentForSub,
  productMatchesCategoryFilter,
  subsForParent,
  type CategoryTree,
} from "./category-tree-utils";
import { DashboardModal } from "./dashboard-modal";
import { VersionImagesPanel } from "./version-images-panel";
import {
  DASHBOARD_BTN_DANGER,
  DASHBOARD_BTN_GHOST,
  DASHBOARD_BTN_PRIMARY,
  DASHBOARD_FIELD,
  DASHBOARD_TABLE,
  DASHBOARD_TABLE_HEAD,
  DASHBOARD_TABLE_WRAP,
} from "./dashboard-styles";

type Modal = "create" | "edit" | "delete" | null;

const initialFormState: ProductFormState = { ok: true };

type Props = {
  marketCode: string;
  marketName: string;
  marketFlag: string | null;
  marketCurrency: string;
  products: MarketProductAdminRow[];
  categoryTree: CategoryTree;
};

function FormFeedback({ state }: { state: ProductFormState }) {
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

type VersionFormRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  is_active: boolean;
  images: MarketProductAdminRow["versions"][number]["images"];
};

function buildVersionRows(product?: MarketProductAdminRow): VersionFormRow[] {
  if (!product?.versions.length) {
    return [{ id: "", name: "Versión única", sku: "", price: 0, stock: 0, is_active: true, images: [] }];
  }
  return product.versions.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku ?? "",
    price: v.marketStock?.price ?? 0,
    stock: v.marketStock?.stock ?? 0,
    is_active: v.is_active && (v.marketStock?.is_active ?? true),
    images: v.images,
  }));
}

function SubcategoryPicker({
  categoryTree,
  subcategoryId,
}: {
  categoryTree: CategoryTree;
  subcategoryId?: string;
}) {
  const initialParent = subcategoryId
    ? (parentForSub(categoryTree, subcategoryId)?.id ?? categoryTree.roots[0]?.id ?? "")
    : (categoryTree.roots[0]?.id ?? "");

  const [parentId, setParentId] = useState(initialParent);
  const subs = parentId ? subsForParent(categoryTree, parentId) : [];

  const [subId, setSubId] = useState(() => {
    if (subcategoryId && subs.some((s) => s.id === subcategoryId)) return subcategoryId;
    return subs[0]?.id ?? "";
  });

  useEffect(() => {
    const nextSubs = parentId ? subsForParent(categoryTree, parentId) : [];
    if (nextSubs.some((s) => s.id === subId)) return;
    setSubId(nextSubs[0]?.id ?? "");
  }, [parentId, categoryTree, subId]);

  return (
    <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-black uppercase text-neutral-600">
        Categoría
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className={DASHBOARD_FIELD}
          required
        >
          {categoryTree.roots.length === 0 ? (
            <option value="">Sin categorías raíz</option>
          ) : (
            categoryTree.roots.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))
          )}
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Subcategoría
        <select
          name="category_id"
          value={subId}
          onChange={(e) => setSubId(e.target.value)}
          className={DASHBOARD_FIELD}
          required
          disabled={subs.length === 0}
        >
          {subs.length === 0 ? (
            <option value="">Crea subcategorías en esta categoría</option>
          ) : (
            subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))
          )}
        </select>
      </label>
      <p className="text-[0.65rem] font-medium normal-case text-neutral-500 sm:col-span-2">
        Los productos se publican en una subcategoría (ej. Skincare → General).
      </p>
    </div>
  );
}

function ProductBaseFields({
  product,
  categoryTree,
}: {
  product?: MarketProductAdminRow;
  categoryTree: CategoryTree;
}) {
  return (
    <>
      <label className="text-xs font-black uppercase text-neutral-600">
        Nombre
        <input name="name" required defaultValue={product?.name} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Slug {product ? "" : "(opcional)"}
        <input name="slug" required={!!product} defaultValue={product?.slug} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
        Descripción
        <textarea
          name="description"
          rows={2}
          defaultValue={product?.description ?? ""}
          className={DASHBOARD_FIELD}
        />
      </label>
      <SubcategoryPicker categoryTree={categoryTree} subcategoryId={product?.category_id} />
      <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600">
        <input
          name="is_featured"
          type="checkbox"
          defaultChecked={product?.is_featured}
          className="size-4 border-2 border-[var(--mks-ink)]"
        />
        Destacado
      </label>
      <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={product?.is_active ?? true}
          className="size-4 border-2 border-[var(--mks-ink)]"
        />
        Activo
      </label>
    </>
  );
}

function VersionFieldsSection({
  marketCode,
  marketCurrency,
  versions,
  onAddVersion,
  onRemoveVersion,
}: {
  marketCode: string;
  marketCurrency: string;
  versions: VersionFormRow[];
  onAddVersion: () => void;
  onRemoveVersion: (index: number) => void;
}) {
  return (
    <div className="md:col-span-2 space-y-4 border-t border-neutral-200 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase text-neutral-600">
          Versiones — precio y stock en {marketCurrency}
        </h3>
        <button type="button" onClick={onAddVersion} className={DASHBOARD_BTN_GHOST}>
          + Versión
        </button>
      </div>

      {versions.map((v, index) => (
        <div key={v.id || `new-${index}`} className="grid gap-3 rounded-xl border-2 border-neutral-200 p-4 md:grid-cols-2">
          {v.id ? <input type="hidden" name="version_id" value={v.id} /> : null}
          <label className="text-xs font-black uppercase text-neutral-600">
            Nombre versión
            <input
              name="version_name"
              required
              defaultValue={v.name}
              className={DASHBOARD_FIELD}
            />
          </label>
          <label className="text-xs font-black uppercase text-neutral-600">
            SKU
            <input name="version_sku" defaultValue={v.sku} className={DASHBOARD_FIELD} />
          </label>
          <label className="text-xs font-black uppercase text-neutral-600">
            Precio ({marketCurrency})
            <input
              name="version_price"
              type="number"
              step="0.01"
              min={0}
              required
              defaultValue={v.price}
              className={DASHBOARD_FIELD}
            />
          </label>
          <label className="text-xs font-black uppercase text-neutral-600">
            Stock
            <input
              name="version_stock"
              type="number"
              min={0}
              required
              defaultValue={v.stock}
              className={DASHBOARD_FIELD}
            />
          </label>
          <label className="text-xs font-black uppercase text-neutral-600">
            Estado
            <select
              name="version_active"
              defaultValue={v.is_active ? "on" : "off"}
              className={DASHBOARD_FIELD}
            >
              <option value="on">Activa</option>
              <option value="off">Inactiva</option>
            </select>
          </label>
          {versions.length > 1 && !v.id ? (
            <div className="flex items-end">
              <button type="button" onClick={() => onRemoveVersion(index)} className={DASHBOARD_BTN_DANGER}>
                Quitar versión
              </button>
            </div>
          ) : null}
          {v.id ? (
            <div className="md:col-span-2">
              <VersionImagesPanel marketCode={marketCode} versionId={v.id} images={v.images} />
            </div>
          ) : (
            <p className="md:col-span-2 text-xs text-neutral-500">
              Guarda el producto para subir imágenes a versiones nuevas.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ProductForm({
  marketCode,
  marketCurrency,
  product,
  categoryTree,
  draftId,
  onCancel,
  onSaved,
  submitLabel,
}: {
  marketCode: string;
  marketCurrency: string;
  product?: MarketProductAdminRow;
  categoryTree: CategoryTree;
  draftId?: string;
  onCancel: () => void;
  onSaved: () => void;
  submitLabel: string;
}) {
  const [versions, setVersions] = useState<VersionFormRow[]>(() => buildVersionRows(product));
  const boundAction = draftId
    ? finalizeProductFromDraft.bind(null, marketCode, draftId)
    : updateProductForForm.bind(null, marketCode, product!.id);
  const [formState, formAction, pending] = useActionState(boundAction, initialFormState);

  useEffect(() => {
    if (formState.ok && formState.message) onSaved();
  }, [formState, onSaved]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <ProductBaseFields product={product} categoryTree={categoryTree} />
      <VersionFieldsSection
        marketCode={marketCode}
        marketCurrency={marketCurrency}
        versions={versions}
        onAddVersion={() =>
          setVersions((prev) => [
            ...prev,
            { id: "", name: "", sku: "", price: 0, stock: 0, is_active: true, images: [] },
          ])
        }
        onRemoveVersion={(index) => setVersions((prev) => prev.filter((_, i) => i !== index))}
      />
      <FormFeedback state={formState} />
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={pending} className={DASHBOARD_BTN_PRIMARY}>
          {pending ? "Guardando…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={DASHBOARD_BTN_GHOST}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function MarketProductsAdmin({
  marketCode,
  marketName,
  marketFlag,
  marketCurrency,
  products,
  categoryTree,
}: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<MarketProductAdminRow | null>(null);
  const [parentFilter, setParentFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const draftIdRef = useRef<string | null>(null);

  const filterSubs =
    parentFilter === "all" ? categoryTree.subcategories : subsForParent(categoryTree, parentFilter);

  const filteredProducts = products.filter((p) =>
    productMatchesCategoryFilter(p.category_id, parentFilter, subcategoryFilter, categoryTree),
  );

  const discardDraft = useCallback(
    async (id: string | null) => {
      if (!id) return;
      await discardProductDraft(id, marketCode);
      if (draftIdRef.current === id) {
        draftIdRef.current = null;
        setDraftId(null);
      }
    },
    [marketCode],
  );

  const close = useCallback(() => {
    void discardDraft(draftIdRef.current);
    setDraftError(null);
    setModal(null);
    setSelected(null);
  }, [discardDraft]);

  const handleCreateSuccess = useCallback(() => {
    draftIdRef.current = null;
    setDraftId(null);
    setModal(null);
    setSelected(null);
  }, []);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    if (modal !== "create") return;

    let cancelled = false;
    setDraftLoading(true);
    setDraftError(null);

    void createProductDraft(marketCode).then((result) => {
      if (cancelled) {
        if (result.ok && result.id) void discardProductDraft(result.id, marketCode);
        return;
      }
      if (result.ok && result.id) {
        draftIdRef.current = result.id;
        setDraftId(result.id);
        setDraftError(null);
      } else {
        setDraftError(result.message ?? "No se pudo preparar el producto.");
      }
      setDraftLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [modal, marketCode]);

  const flag = marketFlag ? `${marketFlag} ` : "";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/mercados" className={DASHBOARD_BTN_GHOST}>
          ← Volver a mercados
        </Link>
        <button type="button" onClick={() => setModal("create")} className={DASHBOARD_BTN_PRIMARY}>
          Nuevo producto
        </button>
      </div>

      <p className="text-xs text-neutral-600">
        Gestionando inventario para {flag}
        {marketName} ({marketCode}). Precio y stock se configuran por versión en este mercado.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-black uppercase text-neutral-600">
          Categoría
          <select
            value={parentFilter}
            onChange={(e) => {
              setParentFilter(e.target.value);
              setSubcategoryFilter("all");
            }}
            className={`${DASHBOARD_FIELD} mt-1 min-w-[10rem]`}
          >
            <option value="all">Todas</option>
            {categoryTree.roots.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-black uppercase text-neutral-600">
          Subcategoría
          <select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            className={`${DASHBOARD_FIELD} mt-1 min-w-[10rem]`}
            disabled={parentFilter === "all" && categoryTree.subcategories.length === 0}
          >
            <option value="all">
              {parentFilter === "all" ? "Todas las subcategorías" : "Todas en esta categoría"}
            </option>
            {filterSubs.map((s) => (
              <option key={s.id} value={s.id}>
                {parentFilter === "all"
                  ? `${categoryPathLabel(categoryTree, s.id).parentName} → ${s.name}`
                  : s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={DASHBOARD_TABLE_WRAP}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Categoría / Subcategoría</th>
              <th className="p-3">Versiones</th>
              <th className="p-3">Precio desde</th>
              <th className="p-3">Stock total</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-neutral-600">
                  {products.length === 0
                    ? "No hay productos. Usa «Nuevo producto» para crear el primero."
                    : "No hay productos con este filtro."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="border-b border-neutral-200">
                  <td className="p-3">
                    <p className="font-bold text-[var(--mks-ink)]">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[0.65rem] text-neutral-500">{p.slug}</p>
                  </td>
                  <td className="p-3 text-sm">
                    {(() => {
                      const { parentName, subcategoryName } = categoryPathLabel(
                        categoryTree,
                        p.category_id,
                      );
                      return (
                        <>
                          <span className="text-neutral-500">{parentName}</span>
                          <span className="mx-1 text-neutral-400">→</span>
                          <span className="font-bold text-[var(--mks-ink)]">{subcategoryName}</span>
                        </>
                      );
                    })()}
                  </td>
                  <td className="p-3">{p.versionCount}</td>
                  <td className="p-3 font-medium">
                    {p.minPrice != null ? formatMoney(p.minPrice, p.currency) : "—"}
                  </td>
                  <td className="p-3">{p.totalStock}</td>
                  <td className="p-3">
                    <span className="text-xs font-bold uppercase">
                      {p.is_active ? "Activo" : "Inactivo"}
                      {p.is_featured ? " · Destacado" : ""}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(p);
                          setModal("edit");
                        }}
                        className={DASHBOARD_BTN_GHOST}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(p);
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

      <DashboardModal open={modal === "create"} onClose={close} title={`Nuevo producto — ${marketCode}`} wide>
        {draftLoading ? (
          <p className="text-sm text-neutral-600">Preparando formulario…</p>
        ) : draftError ? (
          <p className="text-sm font-bold text-[var(--mks-pink)]">{draftError}</p>
        ) : draftId ? (
          <ProductForm
            key={draftId}
            marketCode={marketCode}
            marketCurrency={marketCurrency}
            categoryTree={categoryTree}
            draftId={draftId}
            onCancel={close}
            onSaved={handleCreateSuccess}
            submitLabel="Crear producto"
          />
        ) : null}
      </DashboardModal>

      <DashboardModal
        open={modal === "edit" && !!selected}
        onClose={close}
        title={`Editar ${selected?.name}`}
        wide
      >
        {selected ? (
          <ProductForm
            key={selected.id}
            marketCode={marketCode}
            marketCurrency={marketCurrency}
            product={selected}
            categoryTree={categoryTree}
            onCancel={close}
            onSaved={close}
            submitLabel="Guardar"
          />
        ) : null}
      </DashboardModal>

      <DashboardModal open={modal === "delete" && !!selected} onClose={close} title="Eliminar producto">
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              ¿Eliminar <strong>{selected.name}</strong>? Se eliminarán todas sus versiones e imágenes.
            </p>
            <form action={deleteProductForm.bind(null, marketCode)} className="flex gap-2">
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
