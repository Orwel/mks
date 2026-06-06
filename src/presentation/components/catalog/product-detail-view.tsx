import Link from "next/link";

import type { CatalogProduct, ProductDetail } from "@/infrastructure/supabase/queries/catalog";
import { ProductCard } from "@/presentation/components/catalog/product-card";
import { ProductDetailInteractive } from "@/presentation/components/catalog/product-detail-interactive";
import type { ProductWithDisplayPrice } from "@/shared/lib/money/resolve-market-pricing";

type Props = {
  product: ProductWithDisplayPrice<ProductDetail>;
  relatedProducts?: ProductWithDisplayPrice<CatalogProduct>[];
};

function metadataEntries(metadata: Record<string, unknown>) {
  return Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== undefined && value !== "" && typeof value !== "object",
  );
}

function formatMetadataValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

export function ProductDetailView({ product, relatedProducts = [] }: Props) {
  const meta = metadataEntries(product.metadata);

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-600">
        <Link href="/" className="text-[var(--mks-ink)] hover:text-[var(--mks-pink)]">
          Inicio
        </Link>
        <span aria-hidden>/</span>
        <Link href="/catalogo" className="text-[var(--mks-ink)] hover:text-[var(--mks-pink)]">
          Catálogo
        </Link>
        {product.parent_category_slug ? (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/categoria/${product.parent_category_slug}`}
              className="text-[var(--mks-ink)] hover:text-[var(--mks-pink)]"
            >
              {product.parent_category_name}
            </Link>
          </>
        ) : null}
        {product.category_slug ? (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/categoria/${product.category_slug}`}
              className="text-[var(--mks-ink)] hover:text-[var(--mks-pink)]"
            >
              {product.category_name}
            </Link>
          </>
        ) : null}
        <span aria-hidden>/</span>
        <span className="text-[var(--mks-pink)]">{product.name}</span>
      </nav>

      <div className="mb-6">
        {product.is_featured ? (
          <p className="mb-2 inline-flex w-fit rounded-lg border-2 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--mks-ink)]">
            Destacado
          </p>
        ) : null}

        <h1 className="font-heading text-3xl font-black leading-tight tracking-tight text-[var(--mks-ink)] md:text-4xl">
          {product.name}
        </h1>

        {product.category_name ? (
          <p className="mt-2 text-sm font-bold text-neutral-600">
            {product.parent_category_name ? (
              <>
                <Link
                  href={`/categoria/${product.parent_category_slug}`}
                  className="text-[var(--mks-pink)] underline decoration-2 underline-offset-2 hover:text-[var(--mks-ink)]"
                >
                  {product.parent_category_name}
                </Link>
                <span className="mx-1 text-neutral-400">›</span>
              </>
            ) : null}
            {product.category_slug ? (
              <Link
                href={`/categoria/${product.category_slug}`}
                className="text-[var(--mks-pink)] underline decoration-2 underline-offset-2 hover:text-[var(--mks-ink)]"
              >
                {product.category_name}
              </Link>
            ) : (
              product.category_name
            )}
          </p>
        ) : null}
      </div>

      <ProductDetailInteractive product={product} />

      {product.description ? (
        <section className="mt-10 border-t-4 border-[var(--mks-ink)] pt-8">
          <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Descripción</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {product.description}
          </p>
        </section>
      ) : null}

      {meta.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Detalles</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {meta.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border-2 border-[var(--mks-ink)] bg-[var(--mks-cream)] px-4 py-3"
              >
                <dt className="text-xs font-black uppercase tracking-wide text-neutral-500">
                  {key.replace(/_/g, " ")}
                </dt>
                <dd className="mt-1 text-sm font-bold text-[var(--mks-ink)]">
                  {formatMetadataValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section className="mt-16 border-t-4 border-[var(--mks-ink)] pt-12">
          <h2 className="font-heading text-2xl font-black text-[var(--mks-ink)]">
            También en {product.category_name}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
