"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import type {
  CatalogCategory,
  CatalogPageData,
  CatalogProduct,
  CatalogSubcategory,
  MetadataFacet,
} from "@/infrastructure/supabase/queries/catalog";
import type { ProductWithDisplayPrice } from "@/shared/lib/money/resolve-market-pricing";
import { MksInput } from "@/presentation/components/auth/mks-field";
import { CategoryNav } from "@/presentation/components/catalog/category-nav";
import { ProductCard } from "@/presentation/components/catalog/product-card";
import {
  catalogFiltersToSearchParams,
  countActiveFilters,
  defaultCatalogFilters,
  filterCatalogProducts,
  parseCatalogSearchParams,
  type CatalogFiltersState,
  type CatalogSort,
  type StockFilter,
} from "@/presentation/components/catalog/catalog-filter-utils";
import { formatMoney } from "@/shared/lib/format-money";
import { cn } from "@/lib/utils";
import { MksDrawer } from "@/presentation/components/ui/mks-drawer";

type Props = Omit<CatalogPageData, "products"> & {
  products: ProductWithDisplayPrice<CatalogProduct>[];
};

const inputClass =
  "w-full rounded-lg border-4 border-[var(--mks-ink)] bg-white px-3 py-2 text-sm font-medium text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-cyan)] outline-none focus:border-[var(--mks-pink)] focus:shadow-[3px_3px_0_0_var(--mks-pink)]";

const labelClass = "text-xs font-black uppercase tracking-wide text-neutral-600";

export function CatalogView({
  categories,
  subcategories,
  products,
  metadataFacets,
  priceRange,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  );

  const filtered = useMemo(
    () => filterCatalogProducts(products, filters),
    [products, filters],
  );

  const activeFilterCount = countActiveFilters(filters);

  const applyFilters = useCallback(
    (next: CatalogFiltersState) => {
      const params = catalogFiltersToSearchParams(next);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/catalogo?${qs}` : "/catalogo", { scroll: false });
      });
    },
    [router],
  );

  const patch = useCallback(
    (partial: Partial<CatalogFiltersState>) => {
      applyFilters({ ...filters, ...partial });
    },
    [applyFilters, filters],
  );

  const clearFilters = () => {
    applyFilters(defaultCatalogFilters());
    setMobileFiltersOpen(false);
  };

  const toggleMetadata = (key: string, value: string) => {
    const next = { ...filters.metadata };
    if (next[key] === value) {
      delete next[key];
    } else {
      next[key] = value;
    }
    patch({ metadata: next });
  };

  const displayCurrency = products[0]?.displayCurrency ?? products[0]?.currency ?? "COP";

  const filtersPanel = (
    <FiltersPanel
      filters={filters}
      priceRange={priceRange}
      displayCurrency={displayCurrency}
      metadataFacets={metadataFacets}
      onPatch={patch}
      onToggleMetadata={toggleMetadata}
      onClear={clearFilters}
      activeFilterCount={activeFilterCount}
    />
  );

  const filterLabel = useMemo(() => {
    if (filters.subcategoria) {
      return subcategories.find((s) => s.slug === filters.subcategoria)?.name ?? filters.subcategoria;
    }
    if (filters.categoria) {
      return categories.find((c) => c.slug === filters.categoria)?.name ?? filters.categoria;
    }
    return null;
  }, [filters.categoria, filters.subcategoria, categories, subcategories]);

  return (
    <div className="border-b-4 border-[var(--mks-ink)] bg-white px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--mks-cyan)]">
            Tienda
          </p>
          <h1 className="font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
            Catálogo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Explora por categoría, busca por nombre o SKU y filtra por precio, stock y atributos del
            producto.
          </p>
        </header>

        {(categories.length > 0 || subcategories.length > 0) ? (
          <CategoryNav
            roots={categories}
            subcategories={subcategories}
            selectedRoot={filters.categoria}
            selectedSub={filters.subcategoria}
            totalCount={products.length}
            onSelectRoot={(slug) => patch({ categoria: slug, subcategoria: null })}
            onSelectSub={(slug, parentSlug) =>
              patch({
                subcategoria: slug,
                categoria: slug ? (parentSlug ?? filters.categoria) : filters.categoria,
              })
            }
          />
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="catalog-search" className="sr-only">
              Buscar productos
            </label>
            <MksInput
              id="catalog-search"
              type="search"
              placeholder="Buscar por nombre, descripción o SKU…"
              value={filters.q}
              onChange={(e) => patch({ q: e.target.value })}
              className="max-w-xl"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] px-4 py-2.5 text-sm font-black text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] lg:hidden"
          >
            Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        <MksDrawer
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          id="catalog-filters-drawer"
          title="Filtros"
          eyebrow="Catálogo"
          side="right"
        >
          {filtersPanel}
        </MksDrawer>

        <div className="flex gap-8">
          <aside className="hidden w-64 shrink-0 lg:block">{filtersPanel}</aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-bold text-neutral-600">
                {filtered.length === 0
                  ? "Sin resultados"
                  : `${filtered.length} producto${filtered.length === 1 ? "" : "s"}`}
                {filterLabel ? ` en ${filterLabel}` : null}
              </p>
              <label className="flex items-center gap-2">
                <span className={labelClass}>Ordenar</span>
                <select
                  value={filters.sort}
                  onChange={(e) => patch({ sort: e.target.value as CatalogSort })}
                  className={cn(inputClass, "w-auto py-1.5")}
                >
                  <option value="name_asc">Nombre A–Z</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="newest">Más recientes</option>
                  <option value="stock_desc">Más stock</option>
                </select>
              </label>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                hasProducts={products.length > 0}
                onClear={clearFilters}
                categoria={filters.categoria}
                subcategoria={filters.subcategoria}
                categories={categories}
                subcategories={subcategories}
              />
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FiltersPanel({
  filters,
  priceRange,
  displayCurrency,
  metadataFacets,
  onPatch,
  onToggleMetadata,
  onClear,
  activeFilterCount,
}: {
  filters: CatalogFiltersState;
  priceRange: { min: number; max: number };
  displayCurrency: string;
  metadataFacets: MetadataFacet[];
  onPatch: (partial: Partial<CatalogFiltersState>) => void;
  onToggleMetadata: (key: string, value: string) => void;
  onClear: () => void;
  activeFilterCount: number;
}) {
  return (
    <div className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] p-4 shadow-[6px_6px_0_0_var(--mks-ink)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-black text-[var(--mks-ink)]">Filtros</h2>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-[var(--mks-pink)] underline underline-offset-2"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <fieldset className="mt-4 space-y-2">
        <legend className={labelClass}>Precio ({displayCurrency})</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="sr-only">Precio mínimo</span>
            <input
              type="number"
              min={0}
              step={100}
              placeholder={priceRange.min > 0 ? String(Math.floor(priceRange.min)) : "Mín"}
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                onPatch({
                  minPrice: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="sr-only">Precio máximo</span>
            <input
              type="number"
              min={0}
              step={100}
              placeholder={priceRange.max > 0 ? String(Math.ceil(priceRange.max)) : "Máx"}
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                onPatch({
                  maxPrice: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className={inputClass}
            />
          </label>
        </div>
        {priceRange.max > priceRange.min ? (
          <p className="text-[0.65rem] text-neutral-500">
            Rango en catálogo: {formatMoney(priceRange.min, displayCurrency)} –{" "}
            {formatMoney(priceRange.max, displayCurrency)}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="mt-4 space-y-2">
        <legend className={labelClass}>Disponibilidad</legend>
        <select
          value={filters.stock}
          onChange={(e) => onPatch({ stock: e.target.value as StockFilter })}
          className={inputClass}
        >
          <option value="in_stock">Con stock</option>
          <option value="out_of_stock">Agotados</option>
          <option value="all">Todos</option>
        </select>
      </fieldset>

      <label className="mt-4 flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={filters.destacados}
          onChange={(e) => onPatch({ destacados: e.target.checked })}
          className="size-4 border-2 border-[var(--mks-ink)]"
        />
        <span className="text-sm font-bold text-[var(--mks-ink)]">Solo destacados</span>
      </label>

      {metadataFacets.map((facet) => (
        <fieldset key={facet.key} className="mt-4 space-y-2">
          <legend className={labelClass}>{facet.label}</legend>
          <div className="flex flex-wrap gap-1.5">
            {facet.options.map((opt) => {
              const active = filters.metadata[facet.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onToggleMetadata(facet.key, opt.value)}
                  className={cn(
                    "rounded-lg border-2 px-2 py-1 text-xs font-bold transition",
                    active
                      ? "border-[var(--mks-ink)] bg-[var(--mks-pink)] text-white"
                      : "border-[var(--mks-ink)]/40 bg-white text-[var(--mks-ink)] hover:border-[var(--mks-ink)]",
                  )}
                >
                  {opt.label} ({opt.count})
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function EmptyState({
  hasProducts,
  onClear,
  categoria,
  subcategoria,
  categories,
  subcategories,
}: {
  hasProducts: boolean;
  onClear: () => void;
  categoria: string | null;
  subcategoria: string | null;
  categories: CatalogCategory[];
  subcategories: CatalogSubcategory[];
}) {
  const sub = subcategories.find((s) => s.slug === subcategoria);
  const root = categories.find((c) => c.slug === categoria);
  const linkSlug = sub?.slug ?? root?.slug;
  const linkName = sub?.name ?? root?.name;

  return (
    <div className="rounded-xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-[var(--mks-cream)]/50 px-6 py-12 text-center">
      <p className="font-heading text-lg font-black text-[var(--mks-ink)]">
        No hay productos con estos filtros
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        {hasProducts
          ? "Prueba otra búsqueda o quita algunos filtros."
          : "Aún no hay productos activos en el catálogo."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hasProducts ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-5 py-2.5 text-sm font-black text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)]"
          >
            Quitar filtros
          </button>
        ) : null}
        {linkSlug ? (
          <Link
            href={`/categoria/${linkSlug}`}
            className="rounded-xl border-4 border-[var(--mks-ink)] bg-white px-5 py-2.5 text-sm font-black text-[var(--mks-ink)]"
          >
            Ver {linkName}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
