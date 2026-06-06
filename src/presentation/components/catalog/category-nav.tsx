"use client";

import type {
  CatalogCategory,
  CatalogSubcategory,
} from "@/infrastructure/supabase/queries/catalog";
import { CategoryChip } from "@/presentation/components/catalog/category-chip";

type Props = {
  roots: CatalogCategory[];
  subcategories: CatalogSubcategory[];
  selectedRoot: string | null;
  selectedSub: string | null;
  totalCount: number;
  onSelectRoot: (slug: string | null) => void;
  onSelectSub: (slug: string | null, parentSlug?: string) => void;
};

export function CategoryNav({
  roots,
  subcategories,
  selectedRoot,
  selectedSub,
  totalCount,
  onSelectRoot,
  onSelectSub,
}: Props) {
  const visibleSubs = selectedRoot
    ? subcategories.filter((s) => s.parent_slug === selectedRoot)
    : subcategories;

  if (roots.length === 0 && subcategories.length === 0) return null;

  return (
    <section className="mb-8 space-y-4" aria-label="Categorías">
      {roots.length > 0 ? (
        <div>
          <h2 className="mb-3 font-heading text-sm font-black uppercase text-[var(--mks-ink)]">
            Categorías
          </h2>
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              active={!selectedRoot && !selectedSub}
              onClick={() => {
                onSelectRoot(null);
                onSelectSub(null);
              }}
              label="Todas"
              count={totalCount}
            />
            {roots.map((cat) => (
              <CategoryChip
                key={cat.id}
                active={selectedRoot === cat.slug && !selectedSub}
                onClick={() => {
                  if (selectedRoot === cat.slug && !selectedSub) {
                    onSelectRoot(null);
                  } else {
                    onSelectRoot(cat.slug);
                    onSelectSub(null);
                  }
                }}
                label={cat.name}
                count={cat.product_count}
              />
            ))}
          </div>
        </div>
      ) : null}

      {visibleSubs.length > 0 ? (
        <div>
          <h2 className="mb-3 font-heading text-sm font-black uppercase text-[var(--mks-ink)]">
            Subcategorías
            {selectedRoot ? (
              <span className="ml-2 font-bold normal-case text-neutral-500">
                · {roots.find((r) => r.slug === selectedRoot)?.name}
              </span>
            ) : null}
          </h2>
          <div className="flex flex-wrap gap-2">
            {selectedRoot ? (
              <CategoryChip
                active={!selectedSub}
                onClick={() => onSelectSub(null)}
                label="Todas en categoría"
                count={
                  roots.find((r) => r.slug === selectedRoot)?.product_count ?? undefined
                }
              />
            ) : null}
            {visibleSubs.map((sub) => (
              <CategoryChip
                key={sub.id}
                active={selectedSub === sub.slug}
                onClick={() => {
                  if (selectedSub === sub.slug) {
                    onSelectSub(null, sub.parent_slug);
                  } else {
                    onSelectSub(sub.slug, sub.parent_slug);
                  }
                }}
                label={sub.name}
                count={sub.product_count}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
