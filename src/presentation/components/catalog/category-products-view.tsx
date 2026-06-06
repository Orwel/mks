"use client";

import Link from "next/link";
import { useMemo } from "react";

import type {
  CatalogCategory,
  CatalogProduct,
  CatalogSubcategory,
} from "@/infrastructure/supabase/queries/catalog";
import type { ProductWithDisplayPrice } from "@/shared/lib/money/resolve-market-pricing";
import { CategoryNav } from "@/presentation/components/catalog/category-nav";
import { ProductCard } from "@/presentation/components/catalog/product-card";

type Props = {
  category: CatalogCategory;
  isSubcategory: boolean;
  parentCategory: CatalogCategory | null;
  products: ProductWithDisplayPrice<CatalogProduct>[];
  roots: CatalogCategory[];
  subcategories: CatalogSubcategory[];
  activeRootSlug: string | null;
  activeSubSlug: string | null;
};

export function CategoryProductsView({
  category,
  isSubcategory,
  parentCategory,
  products,
  roots,
  subcategories,
  activeRootSlug,
  activeSubSlug,
}: Props) {
  const sorted = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [products],
  );

  return (
    <div className="border-b-4 border-[var(--mks-ink)] bg-white px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <Link
            href="/catalogo"
            className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mks-pink)] hover:text-[var(--mks-ink)]"
          >
            ← Catálogo
          </Link>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--mks-cyan)]">
            {isSubcategory ? "Subcategoría" : "Categoría"}
          </p>
          {isSubcategory && parentCategory ? (
            <p className="mt-1 text-sm font-bold text-neutral-500">{parentCategory.name}</p>
          ) : null}
          <h1 className="font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">{category.description}</p>
          ) : (
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              Productos de {isSubcategory ? "esta subcategoría" : "esta categoría y sus subcategorías"}.
            </p>
          )}
        </header>

        {(roots.length > 0 || subcategories.length > 0) ? (
          <CategoryNav
            roots={roots}
            subcategories={subcategories}
            selectedRoot={activeRootSlug}
            selectedSub={activeSubSlug}
            totalCount={products.length}
            onSelectRoot={(slug) => {
              if (!slug) {
                window.location.href = "/catalogo";
                return;
              }
              window.location.href = `/categoria/${slug}`;
            }}
            onSelectSub={(slug) => {
              if (!slug) {
                if (activeRootSlug) {
                  window.location.href = `/categoria/${activeRootSlug}`;
                }
                return;
              }
              window.location.href = `/categoria/${slug}`;
            }}
          />
        ) : null}

        <p className="mb-4 text-sm font-bold text-neutral-600">
          {sorted.length === 0
            ? "Sin productos en esta categoría"
            : `${sorted.length} producto${sorted.length === 1 ? "" : "s"}`}
        </p>

        {sorted.length === 0 ? (
          <div className="rounded-xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-[var(--mks-cream)]/50 px-6 py-12 text-center">
            <p className="font-heading text-lg font-black text-[var(--mks-ink)]">
              Aún no hay productos aquí
            </p>
            <Link
              href="/catalogo"
              className="mt-6 inline-block rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-5 py-2.5 text-sm font-black text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)]"
            >
              Ver catálogo completo
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
