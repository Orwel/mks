"use client";

import { useState } from "react";

import { reserveCartLine } from "@/app/(public)/carrito/actions";
import { useCartStore } from "@/presentation/stores/cart-store";

type Props = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  availableStock: number;
  imageUrl?: string | null;
  size?: "default" | "large";
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

export function AddToCartButton(props: Props) {
  const upsertLine = useCartStore((s) => s.upsertLine);
  const lines = useCartStore((s) => s.lines);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = props.availableStock < 1 || loading;

  const onAdd = async () => {
    setError(null);
    const current = lines.find((l) => l.productId === props.productId)?.quantity ?? 0;
    const next = current + 1;
    if (next > props.availableStock) {
      setError("Sin stock suficiente.");
      return;
    }
    setLoading(true);
    const r = await reserveCartLine({ productId: props.productId, quantity: next });
    setLoading(false);
    if (!r.ok) {
      setError(reserveErrorMessage(r.error));
      return;
    }
    upsertLine({
      productId: props.productId,
      slug: props.slug,
      name: props.name,
      price: props.price,
      currency: props.currency,
      quantity: next,
      imageUrl: props.imageUrl,
    });
  };

  const isLarge = props.size === "large";

  return (
    <div className={isLarge ? "space-y-2" : "mt-2 space-y-1"}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void onAdd()}
        className={`w-full border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] text-center font-black uppercase text-[var(--mks-ink)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
          isLarge
            ? "rounded-xl py-4 text-sm shadow-[6px_6px_0_0_var(--mks-ink)]"
            : "rounded-lg py-2 text-xs shadow-[3px_3px_0_0_var(--mks-ink)]"
        }`}
      >
        {loading ? "…" : "Añadir al carrito"}
      </button>
      {error ? (
        <p
          className={`text-center font-bold text-[var(--mks-pink)] ${isLarge ? "text-sm" : "text-[0.65rem]"}`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
