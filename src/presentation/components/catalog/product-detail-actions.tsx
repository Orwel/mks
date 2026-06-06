"use client";

import Link from "next/link";
import { useState } from "react";

import { reserveCartLine } from "@/app/(public)/carrito/actions";
import { useCartStore } from "@/presentation/stores/cart-store";

type Props = {
  productId: string;
  versionId: string;
  marketCode: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  availableStock: number;
  imageUrl?: string | null;
};

function reserveErrorMessage(code: string): string {
  const map: Record<string, string> = {
    insufficient_stock: "Sin stock suficiente.",
    product_not_found: "Producto no disponible.",
    invalid_cart: "Error de carrito.",
    invalid_quantity: "Cantidad no válida.",
    reserve_failed: "No se pudo reservar.",
  };
  return map[code] ?? code;
}

export function ProductDetailActions({
  productId,
  versionId,
  marketCode,
  slug,
  name,
  price,
  currency,
  availableStock,
  imageUrl,
}: Props) {
  const upsertLine = useCartStore((s) => s.upsertLine);
  const lines = useCartStore((s) => s.lines);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inStock = availableStock > 0;
  const cartQty = lines.find((l) => l.versionId === versionId)?.quantity ?? 0;
  const maxAdd = Math.max(0, availableStock - cartQty);
  const disabled = !inStock || loading || maxAdd < 1;

  const clampQuantity = (value: number) =>
    Math.min(Math.max(1, value), Math.max(1, maxAdd));

  const onAdd = async () => {
    setError(null);
    const qty = clampQuantity(quantity);
    const next = cartQty + qty;
    if (next > availableStock) {
      setError("Sin stock suficiente.");
      return;
    }
    setLoading(true);
    const r = await reserveCartLine({ versionId, marketCode, quantity: next });
    setLoading(false);
    if (!r.ok) {
      setError(reserveErrorMessage(r.error));
      return;
    }
    upsertLine({
      productId,
      versionId,
      marketCode,
      slug,
      name,
      price,
      currency,
      quantity: next,
      imageUrl,
    });
    setQuantity(1);
  };

  return (
    <div className="mt-8 space-y-3">
      {inStock ? (
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
              Cantidad
            </span>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={disabled || quantity <= 1}
                onClick={() => setQuantity((q) => clampQuantity(q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-lg border-4 border-[var(--mks-ink)] bg-white text-lg font-black text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-ink)] transition enabled:hover:bg-[var(--mks-yellow)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Menos"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={maxAdd}
                value={quantity}
                disabled={disabled}
                onChange={(e) => setQuantity(clampQuantity(Number(e.target.value) || 1))}
                className="h-11 w-16 rounded-lg border-4 border-[var(--mks-ink)] bg-white text-center text-sm font-black text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-cyan)] outline-none focus:border-[var(--mks-pink)]"
                aria-label="Cantidad a añadir"
              />
              <button
                type="button"
                disabled={disabled || quantity >= maxAdd}
                onClick={() => setQuantity((q) => clampQuantity(q + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-lg border-4 border-[var(--mks-ink)] bg-white text-lg font-black text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-ink)] transition enabled:hover:bg-[var(--mks-yellow)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Más"
              >
                +
              </button>
            </div>
          </label>
          {cartQty > 0 ? (
            <p className="pb-2 text-xs font-bold text-neutral-600">
              {cartQty} en tu carrito · puedes añadir hasta {maxAdd} más
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => void onAdd()}
        className="w-full rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] py-4 text-center text-sm font-black uppercase text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)] transition enabled:hover:bg-[var(--mks-yellow)] enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "…" : inStock ? "Añadir al carrito" : "Agotado"}
      </button>

      {error ? (
        <p className="text-center text-sm font-bold text-[var(--mks-pink)]">{error}</p>
      ) : null}

      <Link
        href="/carrito"
        className="block w-full rounded-xl border-4 border-[var(--mks-ink)] bg-white py-3 text-center text-sm font-black uppercase text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)] hover:-translate-y-0.5"
      >
        Ver carrito
      </Link>
    </div>
  );
}
