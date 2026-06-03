"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import {
  createProductDraft,
  discardProductDraft,
  deleteProductForm,
  finalizeProductFromDraft,
  updateProductForForm,
  type ProductFormState,
} from "@/app/(dashboard)/productos/actions";
import { formatMoney } from "@/shared/lib/format-money";

import { DashboardModal } from "./dashboard-modal";
import {
  ProductImagesPanel,
  type ProductImageAdminRow,
} from "./product-images-panel";
import {
  DASHBOARD_BTN_DANGER,
  DASHBOARD_BTN_GHOST,
  DASHBOARD_BTN_PRIMARY,
  DASHBOARD_FIELD,
  DASHBOARD_TABLE,
  DASHBOARD_TABLE_HEAD,
  DASHBOARD_TABLE_WRAP,
} from "./dashboard-styles";

type CategoryOption = { id: string; name: string };

type CurrencyOption = { code: string; name: string };

export type ProductAdminRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string;
  price: number;
  currency: string;
  stock: number;
  sku: string | null;
  is_featured: boolean;
  is_active: boolean;
  categoryName: string;
};

type Modal = "create" | "edit" | "delete" | null;

const initialFormState: ProductFormState = { ok: true };

type Props = {
  products: ProductAdminRow[];
  categories: CategoryOption[];
  currencies: CurrencyOption[];
  imagesByProduct: Record<string, ProductImageAdminRow[]>;
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

function ProductFormFields({
  product,
  categories,
  currencies,
}: {
  product?: ProductAdminRow;
  categories: CategoryOption[];
  currencies: CurrencyOption[];
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
      <label className="text-xs font-black uppercase text-neutral-600">
        Categoría
        <select name="category_id" required defaultValue={product?.category_id} className={DASHBOARD_FIELD}>
          {!product ? <option value="">—</option> : null}
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        SKU
        <input name="sku" defaultValue={product?.sku ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Divisa
        <select name="currency" required defaultValue={product?.currency ?? "COP"} className={DASHBOARD_FIELD}>
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Precio
        <input
          name="price"
          type="number"
          step="0.01"
          min={0}
          required
          defaultValue={product?.price}
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Stock
        <input
          name="stock"
          type="number"
          min={0}
          required
          defaultValue={product?.stock ?? 0}
          className={DASHBOARD_FIELD}
        />
      </label>
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

function EditProductForm({
  product,
  categories,
  currencies,
  images,
  onSaved,
}: {
  product: ProductAdminRow;
  categories: CategoryOption[];
  currencies: CurrencyOption[];
  images: ProductImageAdminRow[];
  onSaved: () => void;
}) {
  const [editState, editAction, editPending] = useActionState(
    updateProductForForm.bind(null, product.id),
    initialFormState,
  );

  useEffect(() => {
    if (editState.ok && editState.message) {
      onSaved();
    }
  }, [editState, onSaved]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ProductImagesPanel productId={product.id} images={images} />
      <form action={editAction} className="contents">
        <ProductFormFields product={product} categories={categories} currencies={currencies} />
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
    </div>
  );
}

function CreateProductForm({
  draftId,
  categories,
  currencies,
  images,
  onCancel,
  onCreated,
}: {
  draftId: string;
  categories: CategoryOption[];
  currencies: CurrencyOption[];
  images: ProductImageAdminRow[];
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [createState, createAction, createPending] = useActionState(
    finalizeProductFromDraft.bind(null, draftId),
    initialFormState,
  );

  useEffect(() => {
    if (createState.ok && createState.message) {
      onCreated();
    }
  }, [createState, onCreated]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ProductImagesPanel productId={draftId} images={images} />
      <form action={createAction} className="contents">
        <ProductFormFields categories={categories} currencies={currencies} />
        <FormFeedback state={createState} />
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" disabled={createPending} className={DASHBOARD_BTN_PRIMARY}>
            {createPending ? "Guardando…" : "Crear producto"}
          </button>
          <button type="button" onClick={onCancel} className={DASHBOARD_BTN_GHOST}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export function ProductsAdmin({ products, categories, currencies, imagesByProduct }: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<ProductAdminRow | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const draftIdRef = useRef<string | null>(null);

  const filteredProducts =
    categoryFilter === "all"
      ? products
      : products.filter((p) => p.category_id === categoryFilter);

  const discardDraft = useCallback(async (id: string | null) => {
    if (!id) return;
    await discardProductDraft(id);
    if (draftIdRef.current === id) {
      draftIdRef.current = null;
      setDraftId(null);
    }
  }, []);

  const close = useCallback(() => {
    void discardDraft(draftIdRef.current);
    setDraftError(null);
    setModal(null);
    setSelected(null);
  }, [discardDraft]);

  const openCreate = () => {
    setSelected(null);
    setDraftError(null);
    setModal("create");
  };

  const openEdit = (p: ProductAdminRow) => {
    setSelected(p);
    setModal("edit");
  };

  const openDelete = (p: ProductAdminRow) => {
    setSelected(p);
    setModal("delete");
  };

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

    void createProductDraft().then((result) => {
      if (cancelled) {
        if (result.ok && result.id) void discardProductDraft(result.id);
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
  }, [modal]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-xs font-black uppercase text-neutral-600">
          Filtrar por categoría
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`${DASHBOARD_FIELD} mt-1 min-w-[12rem]`}
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={openCreate} className={DASHBOARD_BTN_PRIMARY}>
          Nuevo producto
        </button>
      </div>

      <div className={`${DASHBOARD_TABLE_WRAP} mt-4`}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Imágenes</th>
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
                    : "No hay productos en esta categoría."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="border-b border-neutral-200">
                  <td className="p-3">
                    <p className="font-bold text-[var(--mks-ink)]">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[0.65rem] text-neutral-500">{p.slug}</p>
                  </td>
                  <td className="p-3 text-sm">{p.categoryName}</td>
                  <td className="p-3 font-medium">{formatMoney(p.price, p.currency)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3 text-sm font-medium">
                    {(imagesByProduct[p.id] ?? []).length}
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-bold uppercase">
                      {p.is_active ? "Activo" : "Inactivo"}
                      {p.is_featured ? " · Destacado" : ""}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(p)} className={DASHBOARD_BTN_GHOST}>
                        Editar
                      </button>
                      <button type="button" onClick={() => openDelete(p)} className={DASHBOARD_BTN_DANGER}>
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

      <DashboardModal open={modal === "create"} onClose={close} title="Nuevo producto" wide>
        {draftLoading ? (
          <p className="text-sm text-neutral-600">Preparando formulario…</p>
        ) : draftError ? (
          <p className="text-sm font-bold text-[var(--mks-pink)]">{draftError}</p>
        ) : draftId ? (
          <CreateProductForm
            key={draftId}
            draftId={draftId}
            categories={categories}
            currencies={currencies}
            images={imagesByProduct[draftId] ?? []}
            onCancel={close}
            onCreated={handleCreateSuccess}
          />
        ) : null}
      </DashboardModal>

      <DashboardModal open={modal === "edit" && !!selected} onClose={close} title="Editar producto" wide>
        {selected ? (
          <EditProductForm
            key={selected.id}
            product={selected}
            categories={categories}
            currencies={currencies}
            images={imagesByProduct[selected.id] ?? []}
            onSaved={close}
          />
        ) : null}
      </DashboardModal>

      <DashboardModal open={modal === "delete" && !!selected} onClose={close} title="Eliminar producto">
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              ¿Eliminar <strong>{selected.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <form action={deleteProductForm} className="flex gap-2">
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
