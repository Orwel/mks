"use client";

import { useMemo, useState } from "react";

import type { ProductDetail, ProductDetailVersion } from "@/infrastructure/supabase/queries/catalog";
import { ProductDetailActions } from "@/presentation/components/catalog/product-detail-actions";
import { ProductImageGallery } from "@/presentation/components/catalog/product-image-gallery";
import { VersionPicker } from "@/presentation/components/catalog/version-picker";
import { formatMoney } from "@/shared/lib/format-money";
import type { ProductWithDisplayPrice } from "@/shared/lib/money/resolve-market-pricing";

type Props = {
  product: ProductWithDisplayPrice<ProductDetail>;
};

function lineName(productName: string, version: ProductDetailVersion, multi: boolean): string {
  if (!multi || version.name === "Versión única") return productName;
  return `${productName} — ${version.name}`;
}

export function ProductDetailInteractive({ product }: Props) {
  const multi = product.versions.length > 1;
  const initialVersion =
    product.versions.find((v) => v.available_stock > 0) ?? product.versions[0] ?? null;
  const [selectedVersionId, setSelectedVersionId] = useState(initialVersion?.id ?? "");

  const selectedVersion = useMemo(
    () => product.versions.find((v) => v.id === selectedVersionId) ?? initialVersion,
    [product.versions, selectedVersionId, initialVersion],
  );

  const inStock = (selectedVersion?.available_stock ?? 0) > 0;
  const galleryImages = selectedVersion?.images.length
    ? selectedVersion.images
    : product.images;

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <ProductImageGallery
        key={selectedVersion?.id ?? "default"}
        name={product.name}
        images={galleryImages}
      />

      <div className="flex flex-col">
        {multi ? (
          <VersionPicker
            versions={product.versions}
            selectedId={selectedVersionId}
            onSelect={setSelectedVersionId}
            displayLocale={product.displayLocale}
          />
        ) : null}

        <p className="mt-2 font-heading text-3xl font-black text-[var(--mks-pink)] md:text-4xl">
          {selectedVersion
            ? formatMoney(selectedVersion.price, selectedVersion.currency, product.displayLocale)
            : formatMoney(product.displayPrice, product.displayCurrency, product.displayLocale)}
        </p>

        <p
          className={`mt-3 text-sm font-bold ${inStock ? "text-emerald-700" : "text-[var(--mks-pink)]"}`}
        >
          {inStock
            ? `${selectedVersion?.available_stock ?? 0} unidad${selectedVersion?.available_stock === 1 ? "" : "es"} disponible${selectedVersion?.available_stock === 1 ? "" : "s"}`
            : "Agotado"}
        </p>

        {selectedVersion?.sku ? (
          <p className="mt-1 text-xs font-medium text-neutral-500">SKU: {selectedVersion.sku}</p>
        ) : null}

        {selectedVersion ? (
          <ProductDetailActions
            productId={product.id}
            versionId={selectedVersion.id}
            marketCode={product.market_code}
            slug={product.slug}
            name={lineName(product.name, selectedVersion, multi)}
            price={selectedVersion.price}
            currency={selectedVersion.currency}
            availableStock={selectedVersion.available_stock}
            imageUrl={selectedVersion.images[0]?.url ?? null}
            priceLabel={
              selectedVersion
                ? formatMoney(selectedVersion.price, selectedVersion.currency, product.displayLocale)
                : formatMoney(product.displayPrice, product.displayCurrency, product.displayLocale)
            }
          />
        ) : null}
      </div>
    </div>
  );
}
