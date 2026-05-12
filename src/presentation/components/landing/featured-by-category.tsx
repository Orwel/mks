import Image from "next/image";
import Link from "next/link";

import type { FeaturedProduct } from "@/infrastructure/supabase/queries/landing";

type Props = {
  products: FeaturedProduct[];
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency || "COP",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function FeaturedByCategory({ products }: Props) {
  if (products.length === 0) {
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

  const byCategory = new Map<string, FeaturedProduct[]>();
  for (const p of products) {
    const key = p.category_slug || "otros";
    const list = byCategory.get(key) ?? [];
    list.push(p);
    byCategory.set(key, list);
  }

  return (
    <section className="border-b-4 border-[var(--mks-ink)] bg-white px-4 py-14 md:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--mks-cyan)]">
            Catálogo
          </p>
          <h2 className="font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
            Destacados por categoría
          </h2>
        </header>

        {[...byCategory.entries()].map(([slug, items]) => {
          const title = items[0]?.category_name ?? slug;
          return (
            <div key={slug}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="font-heading text-xl font-black text-[var(--mks-ink)]">{title}</h3>
                <Link
                  href={`/categoria/${slug}`}
                  className="text-sm font-bold text-[var(--mks-pink)] underline decoration-4 underline-offset-4 hover:text-[var(--mks-ink)]"
                >
                  Ver categoría
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/catalogo/${p.slug}`}
                    className="group w-[220px] shrink-0 overflow-hidden rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] shadow-[6px_6px_0_0_var(--mks-ink)] transition-transform hover:-translate-y-1"
                  >
                    <div className="relative aspect-square w-full bg-gradient-to-br from-[var(--mks-pink)]/30 to-[var(--mks-cyan)]/40">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="220px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-4 text-center font-heading text-lg font-black text-[var(--mks-ink)]">
                          {p.name}
                        </div>
                      )}
                    </div>
                    <div className="border-t-4 border-[var(--mks-ink)] p-3">
                      <p className="line-clamp-2 font-heading text-sm font-bold text-[var(--mks-ink)]">
                        {p.name}
                      </p>
                      <p className="mt-1 text-sm font-black text-[var(--mks-pink)]">
                        {formatMoney(p.price, p.currency)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {p.available_stock > 0 ? `${p.available_stock} disponibles` : "Agotado"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
