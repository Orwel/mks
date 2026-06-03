"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { FeaturedProduct, LandingCategory } from "@/infrastructure/supabase/queries/landing";
import { AddToCartButton } from "@/presentation/components/cart/add-to-cart-button";
import { CategoryChip } from "@/presentation/components/catalog/category-chip";
import { FeaturedProductGallery } from "@/presentation/components/landing/featured-product-gallery";
import { formatMoney } from "@/shared/lib/format-money";

type Props = {
  categories: LandingCategory[];
  products: FeaturedProduct[];
};

export function FeaturedByCategory({ categories, products }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const byCategory = useMemo(() => {
    const map = new Map<string, FeaturedProduct[]>();
    for (const p of products) {
      const key = p.category_slug || "otros";
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [products]);

  const orderedCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    return [...byCategory.entries()].map(([slug, items]) => ({
      id: slug,
      slug,
      name: items[0]?.category_name ?? slug,
      product_count: items.length,
    }));
  }, [categories, byCategory]);

  const visibleSections = useMemo(() => {
    if (selectedSlug) {
      const items = byCategory.get(selectedSlug) ?? [];
      const cat = orderedCategories.find((c) => c.slug === selectedSlug);
      return [{ slug: selectedSlug, title: cat?.name ?? selectedSlug, items }];
    }
    return orderedCategories
      .filter((c) => byCategory.has(c.slug))
      .map((c) => ({
        slug: c.slug,
        title: c.name,
        items: byCategory.get(c.slug) ?? [],
      }));
  }, [selectedSlug, orderedCategories, byCategory]);

  if (orderedCategories.length === 0 && products.length === 0) {
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
            className="mt-6 inline-block rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-6 py-3 text-sm font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)]"
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

        {orderedCategories.length > 0 ? (
          <div
            className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Categorías"
          >
            <CategoryChip
              active={selectedSlug === null}
              label="Todas"
              onClick={() => setSelectedSlug(null)}
            />
            {orderedCategories.map((cat) => (
              <CategoryChip
                key={cat.id}
                active={selectedSlug === cat.slug}
                label={cat.name}
                count={cat.product_count}
                onClick={() =>
                  setSelectedSlug((prev) => (prev === cat.slug ? null : cat.slug))
                }
              />
            ))}
          </div>
        ) : null}

        <div className="space-y-12">
          {visibleSections.map(({ slug, title, items }) => (
            <CategorySection key={slug} slug={slug} title={title} items={items} />
          ))}

          {selectedSlug && visibleSections[0]?.items.length === 0 ? (
            <CategoryEmptyState
              title={visibleSections[0]?.title ?? selectedSlug}
              slug={selectedSlug}
            />
          ) : null}

          {!selectedSlug && visibleSections.length === 0 ? (
            <p className="text-center text-sm text-neutral-600">
              No hay productos destacados con stock. Explora el catálogo completo.
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
  items,
}: {
  slug: string;
  title: string;
  items: FeaturedProduct[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-heading text-xl font-black text-[var(--mks-ink)]">{title}</h3>
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

function CategoryEmptyState({ title, slug }: { title: string; slug: string }) {
  return (
    <div className="rounded-xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-[var(--mks-cream)]/50 px-6 py-10 text-center">
      <p className="font-heading text-lg font-black text-[var(--mks-ink)]">
        Sin destacados en {title}
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        Puedes ver todos los productos de esta categoría en el catálogo.
      </p>
      <Link
        href={`/categoria/${slug}`}
        className="mt-5 inline-block rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-5 py-2.5 text-sm font-black text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]"
      >
        Ver categoría {title}
      </Link>
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
