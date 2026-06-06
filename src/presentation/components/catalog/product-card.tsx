import Image from "next/image";
import Link from "next/link";

import type { CatalogProduct } from "@/infrastructure/supabase/queries/catalog";
import { AddToCartButton } from "@/presentation/components/cart/add-to-cart-button";
import { formatMoney } from "@/shared/lib/format-money";
import type { ProductWithDisplayPrice } from "@/shared/lib/money/resolve-market-pricing";

type Props = {
  product: ProductWithDisplayPrice<CatalogProduct>;
};

export function ProductCard({ product }: Props) {
  const inStock = product.available_stock > 0;

  return (
    <article className="group overflow-hidden rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] shadow-[6px_6px_0_0_var(--mks-ink)] transition-transform hover:-translate-y-1">
      <Link href={`/catalogo/${product.slug}`} className="block">
        <div className="relative aspect-square w-full bg-gradient-to-br from-[var(--mks-pink)]/30 to-[var(--mks-cyan)]/40">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center font-heading text-lg font-black text-[var(--mks-ink)]">
              {product.name}
            </div>
          )}
          {product.is_featured ? (
            <span className="absolute left-2 top-2 rounded-md border-2 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-2 py-0.5 text-[0.65rem] font-black uppercase">
              Destacado
            </span>
          ) : null}
        </div>
      </Link>
      <div className="border-t-4 border-[var(--mks-ink)] p-4">
        {product.category_name ? (
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            {product.category_name}
          </p>
        ) : null}
        <Link href={`/catalogo/${product.slug}`}>
          <h2 className="mt-1 line-clamp-2 font-heading text-base font-bold text-[var(--mks-ink)] hover:underline">
            {product.name}
          </h2>
        </Link>
        {product.description ? (
          <p className="mt-2 line-clamp-2 text-xs text-neutral-600">{product.description}</p>
        ) : null}
        <p className="mt-2 text-lg font-black text-[var(--mks-pink)]">
          {formatMoney(product.displayPrice, product.displayCurrency, product.displayLocale)}
        </p>
        <p className={`text-xs font-bold ${inStock ? "text-emerald-700" : "text-[var(--mks-pink)]"}`}>
          {inStock
            ? `${product.available_stock} disponible${product.available_stock === 1 ? "" : "s"}`
            : "Agotado"}
        </p>
        <AddToCartButton
          productId={product.id}
          versionId={product.default_version_id ?? ""}
          marketCode={product.market_code}
          slug={product.slug}
          name={product.name}
          price={product.displayPrice}
          currency={product.displayCurrency}
          availableStock={product.available_stock}
          imageUrl={product.image_url}
        />
      </div>
    </article>
  );
}
