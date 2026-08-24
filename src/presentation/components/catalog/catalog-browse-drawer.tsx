"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { CatalogCategory } from "@/infrastructure/supabase/queries/catalog";
import { MksInput } from "@/presentation/components/auth/mks-field";
import { CategoryChip } from "@/presentation/components/catalog/category-chip";
import {
  catalogFiltersToSearchParams,
  countActiveFilters,
  defaultCatalogFilters,
  parseCatalogSearchParams,
  type CatalogFiltersState,
  type StockFilter,
} from "@/presentation/components/catalog/catalog-filter-utils";
import { useHydrated } from "@/presentation/lib/use-hydrated";
type Props = {
  categories: CatalogCategory[];
  totalProducts: number;
};

const inputClass =
  "w-full rounded-lg border-4 border-[var(--mks-ink)] bg-white px-3 py-2 text-sm font-medium text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-cyan)] outline-none focus:border-[var(--mks-pink)] focus:shadow-[3px_3px_0_0_var(--mks-pink)]";

const labelClass = "text-xs font-black uppercase tracking-wide text-neutral-600";

export function CatalogBrowseDrawer({ categories, totalProducts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const mounted = useHydrated();
  const [draft, setDraft] = useState<CatalogFiltersState>(defaultCatalogFilters);

  const urlFilters = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  );

  const activeOnPage = pathname === "/catalogo" ? countActiveFilters(urlFilters) : 0;

  const openDrawer = useCallback(() => {
    setDraft(pathname === "/catalogo" ? urlFilters : defaultCatalogFilters());
    setOpen(true);
  }, [pathname, urlFilters]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const applyAndGo = () => {
    const params = catalogFiltersToSearchParams(draft);
    const qs = params.toString();
    setOpen(false);
    router.push(qs ? `/catalogo?${qs}` : "/catalogo");
  };

  const patch = (partial: Partial<CatalogFiltersState>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const clearDraft = () => {
    setDraft(defaultCatalogFilters());
  };

  const draftActiveCount = countActiveFilters(draft);

  const drawerContent =
    mounted && open ? (
      <>
        <button
          type="button"
          aria-label="Cerrar panel de exploración"
          className="fixed inset-0 z-[80] bg-[var(--mks-ink)]/40 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
        <aside
          id="catalog-browse-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Explorar catálogo"
          className="fixed inset-y-0 right-0 z-[90] flex h-dvh max-h-dvh w-full max-w-md flex-col border-l-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] shadow-[-8px_0_0_0_var(--mks-cyan)]"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b-4 border-[var(--mks-ink)] bg-white px-4 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mks-cyan)]">
                Tienda
              </p>
              <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">
                Explorar catálogo
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border-4 border-[var(--mks-ink)] bg-white p-2 text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <label htmlFor="drawer-catalog-search" className="sr-only">
              Buscar productos
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                aria-hidden
              />
              <MksInput
                id="drawer-catalog-search"
                type="search"
                placeholder="Buscar por nombre, descripción o SKU…"
                value={draft.q}
                onChange={(e) => patch({ q: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyAndGo();
                  }
                }}
                className="pl-10"
              />
            </div>

          {categories.length > 0 ? (
            <section className="mt-6" aria-label="Categorías">
              <h3 className={labelClass}>Categorías</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <CategoryChip
                  active={!draft.categoria}
                  label="Todas"
                  count={totalProducts}
                  onClick={() => patch({ categoria: null })}
                />
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    active={draft.categoria === cat.slug}
                    label={cat.name}
                    count={cat.product_count}
                    onClick={() =>
                      patch({
                        categoria: draft.categoria === cat.slug ? null : cat.slug,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

            <fieldset className="mt-6 space-y-2">
              <legend className={labelClass}>Disponibilidad</legend>
              <select
                value={draft.stock}
                onChange={(e) => patch({ stock: e.target.value as StockFilter })}
                className={inputClass}
              >
                <option value="all">Todos</option>
                <option value="in_stock">Con stock</option>
                <option value="out_of_stock">Agotados</option>
              </select>
            </fieldset>

            <label className="mt-4 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={draft.destacados}
                onChange={(e) => patch({ destacados: e.target.checked })}
                className="size-4 border-2 border-[var(--mks-ink)]"
              />
              <span className="text-sm font-bold text-[var(--mks-ink)]">Solo destacados</span>
            </label>
          </div>

          <div className="shrink-0 space-y-2 border-t-4 border-[var(--mks-ink)] bg-white p-4">
            {draftActiveCount > 0 ? (
              <button
                type="button"
                onClick={clearDraft}
                className="w-full text-center text-xs font-bold text-[var(--mks-pink)] underline underline-offset-2"
              >
                Limpiar selección
              </button>
            ) : null}
            <button
              type="button"
              onClick={applyAndGo}
              className="w-full rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-4 py-3 text-sm font-black text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)] hover:-translate-y-0.5"
            >
              Ver resultados
            </button>
            <Link
              href="/catalogo"
              onClick={() => setOpen(false)}
              className="block w-full rounded-xl border-4 border-[var(--mks-ink)] bg-white px-4 py-2.5 text-center text-sm font-black text-[var(--mks-ink)]"
            >
              Ir al catálogo completo
            </Link>
          </div>
        </aside>
      </>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        aria-expanded={open}
        aria-controls="catalog-browse-drawer"
        className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40 md:gap-2 md:px-3"
      >
        <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
        <span className="hidden sm:inline">Explorar</span>
        {activeOnPage > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-2 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-0.5 text-[0.625rem] font-black leading-none text-white sm:static sm:ml-0.5 sm:h-auto sm:min-w-0 sm:rounded-full sm:border-0 sm:bg-[var(--mks-pink)]/20 sm:px-1.5 sm:py-0.5 sm:text-[0.65rem] sm:text-[var(--mks-pink)]">
            {activeOnPage}
          </span>
        ) : null}
      </button>

      {drawerContent && mounted ? createPortal(drawerContent, document.body) : null}
    </>
  );
}

