"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  FeaturedProduct,
  LandingCategory,
  LandingSubcategory,
} from "@/infrastructure/supabase/queries/landing";
import { AddToCartButton } from "@/presentation/components/cart/add-to-cart-button";
import { CategoryNav } from "@/presentation/components/catalog/category-nav";
import { FeaturedProductGallery } from "@/presentation/components/landing/featured-product-gallery";
import { formatMoney } from "@/shared/lib/format-money";

type Props = {
  categories: LandingCategory[];
  subcategories: LandingSubcategory[];
  products: FeaturedProduct[];
};

export function FeaturedByCategory({ categories, subcategories, products }: Props) {
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedSub && p.category_slug !== selectedSub) return false;
      if (selectedRoot && !selectedSub && p.parent_category_slug !== selectedRoot) return false;
      return true;
    });
  }, [products, selectedRoot, selectedSub]);

  const visibleSections = useMemo(() => {
    const bySub = new Map<string, FeaturedProduct[]>();
    for (const p of filteredProducts) {
      const key = p.category_slug || "otros";
      const list = bySub.get(key) ?? [];
      list.push(p);
      bySub.set(key, list);
    }

    const subsToShow = selectedSub
      ? subcategories.filter((s) => s.slug === selectedSub)
      : selectedRoot
        ? subcategories.filter((s) => s.parent_slug === selectedRoot)
        : subcategories.filter((s) => bySub.has(s.slug));

    return subsToShow
      .filter((s) => bySub.has(s.slug))
      .map((s) => ({
        slug: s.slug,
        title: s.name,
        parentTitle: s.parent_name,
        items: bySub.get(s.slug) ?? [],
      }));
  }, [filteredProducts, selectedRoot, selectedSub, subcategories]);

  if (categories.length === 0 && products.length === 0) {
    return (
      <section className="border-b-4 border-[var(--mks-ink)] bg-white px-4 py-16 md:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-heading text-2xl font-black text-[var(--mks-ink)]">
            Próximamente: destacados por categoría
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            Marca productos como destacados en el panel o ejecuta el seed para ver ejemplos aquí.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-block rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-6 py-3 text-sm font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)]"
          >
            Ir al catálogo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b-4 border-[var(--mks-ink)] bg-white px-4 py-14 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--mks-cyan)]">
            Catálogo
          </p>
          <h2 className="font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
            Destacados por categoría
          </h2>
        </header>

        <CategoryNav
          roots={categories.map((c) => ({
            ...c,
            description: null,
            image_url: null,
          }))}
          subcategories={subcategories.map((s) => ({
            ...s,
            description: null,
            image_url: null,
          }))}
          selectedRoot={selectedRoot}
          selectedSub={selectedSub}
          totalCount={products.length}
          onSelectRoot={(slug) => {
            setSelectedRoot(slug);
            setSelectedSub(null);
          }}
          onSelectSub={(slug, parentSlug) => {
            setSelectedSub(slug);
            if (slug && parentSlug) setSelectedRoot(parentSlug);
          }}
        />

        <div className="space-y-12">
          {visibleSections.map(({ slug, title, parentTitle, items }) => (
            <CategorySection
              key={slug}
              slug={slug}
              title={title}
              parentTitle={parentTitle}
              items={items}
            />
          ))}

          {filteredProducts.length === 0 ? (
            <p className="text-center text-sm text-neutral-600">
              No hay productos destacados con estos filtros. Explora el catálogo completo.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CategorySection({
  slug,
  title,
  parentTitle,
  items,
}: {
  slug: string;
  title: string;
  parentTitle: string;
  items: FeaturedProduct[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          {parentTitle ? (
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              {parentTitle}
            </p>
          ) : null}
          <h3 className="font-heading text-xl font-black text-[var(--mks-ink)]">{title}</h3>
        </div>
        <Link
          href={`/categoria/${slug}`}
          className="shrink-0 text-sm font-bold text-[var(--mks-pink)] underline decoration-4 underline-offset-4 hover:text-[var(--mks-ink)]"
        >
          Ver todos
        </Link>
      </div>
      <ProductCarousel items={items} />
    </div>
  );
}

function ProductCarousel({ items }: { items: FeaturedProduct[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((p) => (
        <div
          key={p.id}
          className="group w-[220px] shrink-0 overflow-hidden rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] shadow-[6px_6px_0_0_var(--mks-ink)] transition-transform hover:-translate-y-1"
        >
          <Link href={`/catalogo/${p.slug}`} className="block">
            <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-[var(--mks-pink)]/30 to-[var(--mks-cyan)]/40">
              <FeaturedProductGallery name={p.name} images={p.images} />
            </div>
          </Link>
          <div className="border-t-4 border-[var(--mks-ink)] p-3">
            <Link href={`/catalogo/${p.slug}`}>
              <p className="line-clamp-2 font-heading text-sm font-bold text-[var(--mks-ink)] hover:underline">
                {p.name}
              </p>
            </Link>
            <p className="mt-1 text-sm font-black text-[var(--mks-pink)]">
              {formatMoney(p.price, p.currency)}
            </p>
            <p className="text-xs text-neutral-500">
              {p.available_stock > 0 ? `${p.available_stock} disponibles` : "Agotado"}
            </p>
            <AddToCartButton
              productId={p.id}
              versionId={p.default_version_id ?? ""}
              marketCode={p.market_code}
              slug={p.slug}
              name={p.name}
              price={p.price}
              currency={p.currency}
              availableStock={p.available_stock}
              imageUrl={p.image_url}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
