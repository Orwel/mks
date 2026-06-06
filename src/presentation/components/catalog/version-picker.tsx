"use client";

import type { ProductDetailVersion } from "@/infrastructure/supabase/queries/catalog";
import { formatMoney } from "@/shared/lib/format-money";
import { cn } from "@/lib/utils";

type Props = {
  versions: ProductDetailVersion[];
  selectedId: string;
  onSelect: (versionId: string) => void;
  displayLocale?: string;
};

export function VersionPicker({ versions, selectedId, onSelect, displayLocale }: Props) {
  const selected = versions.find((v) => v.id === selectedId) ?? versions[0];

  if (versions.length <= 1) return null;

  return (
    <div className="mb-6">
      <p className="text-sm text-neutral-700">
        <span className="font-black uppercase tracking-wide text-neutral-600">Versión: </span>
        <span className="font-bold text-[var(--mks-ink)]">{selected?.name ?? "—"}</span>
      </p>
      <div
        className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Seleccionar versión"
      >
        {versions.map((v) => {
          const isSelected = v.id === selectedId;
          const outOfStock = v.available_stock < 1;

          return (
            <button
              key={v.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={outOfStock}
              onClick={() => onSelect(v.id)}
              className={cn(
                "min-w-[9rem] max-w-[12rem] rounded-lg border-2 px-3 py-2.5 text-left transition",
                isSelected
                  ? "border-[var(--mks-cyan)] bg-[var(--mks-cyan)]/15 shadow-[0_0_0_2px_var(--mks-cyan)]"
                  : "border-neutral-300 bg-white hover:border-[var(--mks-ink)]/50",
                outOfStock && "cursor-not-allowed opacity-50",
              )}
            >
              <span className="line-clamp-2 text-xs font-bold leading-snug text-[var(--mks-ink)]">
                {v.name}
              </span>
              <span className="mt-1 block text-sm font-black text-[var(--mks-pink)]">
                {formatMoney(v.price, v.currency, displayLocale)}
              </span>
              {outOfStock ? (
                <span className="mt-0.5 block text-[0.65rem] font-bold text-neutral-500">
                  Agotado
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
