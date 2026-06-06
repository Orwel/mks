"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import {
  deleteVersionImageForm,
  uploadVersionImagesForm,
  type VersionImageUploadState,
} from "@/app/(dashboard)/mercados/[code]/productos/actions";
import type { VersionImageRow } from "@/infrastructure/supabase/queries/product-versions";
import {
  DASHBOARD_BTN_DANGER,
  DASHBOARD_BTN_PRIMARY,
  DASHBOARD_TABLE,
  DASHBOARD_TABLE_HEAD,
  DASHBOARD_TABLE_WRAP,
} from "./dashboard-styles";

const initialUploadState: VersionImageUploadState = { ok: true };

type Props = {
  marketCode: string;
  versionId: string;
  images: VersionImageRow[];
};

export function VersionImagesPanel({ marketCode, versionId, images }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputKey = useRef(0);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [, startUploadTransition] = useTransition();
  const boundUpload = uploadVersionImagesForm.bind(null, marketCode);
  const [uploadState, uploadAction, uploadPending] = useActionState(boundUpload, initialUploadState);

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  useEffect(() => {
    if (!uploadState.message) return;
    if (uploadState.ok) {
      fileInputKey.current += 1;
      router.refresh();
    }
  }, [uploadState, router]);

  const handleUpload = () => {
    const input = fileInputRef.current;
    if (!input?.files?.length) return;
    const fd = new FormData();
    fd.set("version_id", versionId);
    for (const file of input.files) {
      fd.append("images", file);
    }
    startUploadTransition(() => {
      uploadAction(fd);
    });
  };

  const handleDelete = (imageId: string) => {
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("image_id", imageId);
      fd.set("version_id", versionId);
      await deleteVersionImageForm(marketCode, fd);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 rounded-xl border-2 border-neutral-200 p-3">
      <div>
        <h4 className="text-xs font-black uppercase tracking-wide text-neutral-600">Imágenes</h4>
        <p className="mt-1 text-[0.65rem] font-medium normal-case text-neutral-500">
          Imágenes propias de esta versión.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[10rem] flex-1 text-xs font-black uppercase text-neutral-600">
          Añadir
          <input
            key={fileInputKey.current}
            ref={fileInputRef}
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="mt-1 block w-full text-sm font-medium file:mr-2 file:rounded-lg file:border-2 file:border-[var(--mks-ink)] file:bg-[var(--mks-cyan)] file:px-2 file:py-1 file:text-[0.65rem] file:font-black file:uppercase"
          />
        </label>
        <button
          type="button"
          disabled={uploadPending}
          onClick={handleUpload}
          className={DASHBOARD_BTN_PRIMARY}
        >
          {uploadPending ? "…" : "Subir"}
        </button>
      </div>

      {uploadState.message ? (
        <p
          className={`text-xs font-bold ${uploadState.ok ? "text-emerald-700" : "text-[var(--mks-pink)]"}`}
          role="status"
        >
          {uploadState.message}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <p className="text-xs text-neutral-600">Sin imágenes.</p>
      ) : (
        <div className={DASHBOARD_TABLE_WRAP}>
          <table className={DASHBOARD_TABLE}>
            <thead className={DASHBOARD_TABLE_HEAD}>
              <tr>
                <th className="p-2">Vista</th>
                <th className="p-2">Principal</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((img) => (
                <tr key={img.id} className="border-b border-neutral-200">
                  <td className="p-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded border-2 border-[var(--mks-ink)] bg-neutral-100">
                      <Image
                        src={img.url}
                        alt={img.alt_text ?? "Imagen"}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  </td>
                  <td className="p-2 text-xs font-bold">{img.is_primary ? "Sí" : "—"}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(img.id)}
                      className={DASHBOARD_BTN_DANGER}
                    >
                      Eliminar
                    </button>
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
