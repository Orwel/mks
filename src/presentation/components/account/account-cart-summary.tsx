"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { CART_RESERVATION_TTL_MINUTES } from "@/shared/constants/cart";
import { formatMoney } from "@/shared/lib/format-money";
import { useCartStore } from "@/presentation/stores/cart-store";
import { mksButtonClass } from "@/presentation/components/ui/mks-button";

const PREVIEW_LINES = 2;

export function AccountCartSummary() {
  const lines = useCartStore((s) => s.lines);
  const [hydrated, setHydrated] = useState(() => useCartStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return undefined;
    return useCartStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((acc, l) => acc + l.price * l.quantity, 0),
    [lines],
  );

  const currency = lines[0]?.currency ?? "COP";

  if (!hydrated) {
    return (
      <div
        className="h-32 animate-pulse rounded-2xl border-4 border-[var(--mks-ink)]/20 bg-white/60"
        aria-hidden
      />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-white/60 p-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-neutral-400" strokeWidth={2.5} aria-hidden />
          <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Carrito</h2>
        </div>
        <p className="mt-2 text-sm font-medium text-neutral-600">Tu carrito está vacío.</p>
        <Link
          href="/catalogo"
          className="mt-4 inline-block text-sm font-black text-[var(--mks-pink)] hover:underline"
        >
          Explorar catálogo →
        </Link>
      </div>
    );
  }

  const preview = lines.slice(0, PREVIEW_LINES);
  const remaining = lines.length - PREVIEW_LINES;

  return (
    <div className="rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[8px_8px_0_0_var(--mks-cyan)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--mks-cyan)]">
            Carrito activo
          </p>
          <h2 className="mt-1 font-heading text-lg font-black text-[var(--mks-ink)]">
            {itemCount} {itemCount === 1 ? "producto" : "productos"}
          </h2>
        </div>
        <span className="rounded-lg border-2 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-2 py-0.5 text-xs font-black text-white">
          {formatMoney(subtotal, currency)}
        </span>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {preview.map((line) => (
          <li key={line.versionId} className="flex justify-between gap-2">
            <span className="min-w-0 truncate font-medium text-[var(--mks-ink)]">
              {line.name} × {line.quantity}
            </span>
            <span className="shrink-0 font-bold">
              {formatMoney(line.price * line.quantity, line.currency)}
            </span>
          </li>
        ))}
        {remaining > 0 ? (
          <li className="text-xs font-bold text-neutral-500">+{remaining} más en el carrito</li>
        ) : null}
      </ul>

      <p className="mt-3 text-xs text-neutral-500">
        Reserva de stock: {CART_RESERVATION_TTL_MINUTES} min.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/carrito" className={mksButtonClass({ variant: "outline", size: "sm" })}>
          Ver carrito
        </Link>
        <Link href="/checkout" className={mksButtonClass({ variant: "accent", size: "sm" })}>
          Ir a pagar
        </Link>
      </div>
    </div>
  );
}
