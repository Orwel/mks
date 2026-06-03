"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import {
  deleteProductImageForm,
  uploadProductImagesForm,
  type ProductImageUploadState,
} from "@/app/(dashboard)/productos/actions";
import {
  DASHBOARD_BTN_DANGER,
  DASHBOARD_BTN_PRIMARY,
  DASHBOARD_TABLE,
  DASHBOARD_TABLE_HEAD,
  DASHBOARD_TABLE_WRAP,
} from "./dashboard-styles";

export type ProductImageAdminRow = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

const initialUploadState: ProductImageUploadState = { ok: true };

type Props = {
  productId: string;
  images: ProductImageAdminRow[];
};

export function ProductImagesPanel({ productId, images }: Props) {
  const router = useRouter();
  const fileInputKey = useRef(0);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadProductImagesForm,
    initialUploadState,
  );

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  useEffect(() => {
    if (!uploadState.message) return;
    if (uploadState.ok) {
      fileInputKey.current += 1;
      router.refresh();
    }
  }, [uploadState, router]);

  const handleDelete = (formData: FormData) => {
    startDeleteTransition(async () => {
      await deleteProductImageForm(formData);
      router.refresh();
    });
  };

  return (
    <div className="md:col-span-2 space-y-3">
      <div>
        <h3 className="text-xs font-black uppercase tracking-wide text-neutral-600">
          Imágenes del producto
        </h3>
        <p className="mt-1 text-[0.65rem] font-medium normal-case text-neutral-500">
          Sube las imágenes aquí antes de guardar el producto. Aparecerán en la tabla y podrás
          eliminarlas cuando quieras.
        </p>
      </div>

      <form action={uploadAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="product_id" value={productId} />
        <label className="min-w-[12rem] flex-1 text-xs font-black uppercase text-neutral-600">
          Añadir imágenes
          <input
            key={fileInputKey.current}
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            required
            className="mt-1 block w-full text-sm font-medium file:mr-3 file:rounded-lg file:border-4 file:border-[var(--mks-ink)] file:bg-[var(--mks-cyan)] file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:text-[var(--mks-ink)]"
          />
        </label>
        <button type="submit" disabled={uploadPending} className={DASHBOARD_BTN_PRIMARY}>
          {uploadPending ? "Subiendo…" : "Subir"}
        </button>
      </form>

      {uploadState.message ? (
        <p
          className={`text-sm font-bold ${uploadState.ok ? "text-emerald-700" : "text-[var(--mks-pink)]"}`}
          role="status"
        >
          {uploadState.message}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-600">Aún no hay imágenes subidas para este producto.</p>
      ) : (
        <div className={DASHBOARD_TABLE_WRAP}>
          <table className={DASHBOARD_TABLE}>
            <thead className={DASHBOARD_TABLE_HEAD}>
              <tr>
                <th className="p-2">Vista</th>
                <th className="p-2">Orden</th>
                <th className="p-2">Principal</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((img) => (
                <tr key={img.id} className="border-b border-neutral-200">
                  <td className="p-2">
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg border-2 border-[var(--mks-ink)] bg-neutral-100">
                      <Image
                        src={img.url}
                        alt={img.alt_text ?? "Imagen del producto"}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  </td>
                  <td className="p-2 text-sm font-medium">{img.sort_order}</td>
                  <td className="p-2 text-xs font-bold uppercase">
                    {img.is_primary ? "Sí" : "—"}
                  </td>
                  <td className="p-2">
                    <form action={handleDelete}>
                      <input type="hidden" name="image_id" value={img.id} />
                      <input type="hidden" name="product_id" value={productId} />
                      <button type="submit" disabled={isDeleting} className={DASHBOARD_BTN_DANGER}>
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
