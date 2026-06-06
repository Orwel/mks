"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { releaseCartLine, reserveCartLine, syncCartReservations } from "@/app/(public)/carrito/actions";
import { CART_RESERVATION_TTL_MINUTES } from "@/shared/constants/cart";
import { useCartStore, type CartLine } from "@/presentation/stores/cart-store";

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

function reserveErrorMessage(code: string): string {
  const map: Record<string, string> = {
    insufficient_stock: "No hay stock suficiente para esta cantidad.",
    product_not_found: "El producto no está disponible.",
    invalid_cart: "No se pudo identificar el carrito. Recarga la página.",
    invalid_quantity: "Cantidad no válida.",
    reserve_failed: "No se pudo reservar stock. Intenta de nuevo.",
  };
  return map[code] ?? code;
}

export function CartView() {
  const lines = useCartStore((s) => s.lines);
  const upsertLine = useCartStore((s) => s.upsertLine);
  const removeLine = useCartStore((s) => s.removeLine);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(() => useCartStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return undefined;
    return useCartStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    let cancelled = false;
    void (async () => {
      const r = await syncCartReservations(
        lines.map((l) => ({
          versionId: l.versionId,
          marketCode: l.marketCode,
          quantity: l.quantity,
        })),
      );
      if (cancelled) return;
      if (!r.ok) {
        setMessage(reserveErrorMessage(r.error));
      } else {
        setMessage(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, lines]);

  const subtotal = useMemo(
    () => lines.reduce((acc, l) => acc + l.price * l.quantity, 0),
    [lines],
  );

  const setQty = useCallback(
    async (line: CartLine, nextQty: number) => {
      setMessage(null);
      if (nextQty < 1) {
        setBusy(line.versionId);
        await releaseCartLine({ versionId: line.versionId, marketCode: line.marketCode });
        removeLine(line.versionId);
        setBusy(null);
        return;
      }
      setBusy(line.versionId);
      const r = await reserveCartLine({
        versionId: line.versionId,
        marketCode: line.marketCode,
        quantity: nextQty,
      });
      if (!r.ok) {
        setMessage(reserveErrorMessage(r.error));
        setBusy(null);
        return;
      }
      upsertLine({ ...line, quantity: nextQty });
      setBusy(null);
    },
    [removeLine, upsertLine],
  );

  if (!hydrated) {
    return (
      <p className="text-sm font-medium text-neutral-600" aria-live="polite">
        Cargando carrito…
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border-4 border-[var(--mks-ink)] bg-white p-8 shadow-[8px_8px_0_0_var(--mks-ink)]">
        <p className="font-heading text-lg font-black text-[var(--mks-ink)]">Tu carrito está vacío</p>
        <p className="mt-2 text-sm text-neutral-600">
          Explora el catálogo o los destacados en la portada y añade productos. Las reservas de stock duran{" "}
          {CART_RESERVATION_TTL_MINUTES} minutos.
        </p>
        <Link
          href="/catalogo"
          className="mt-6 inline-block rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-6 py-3 text-sm font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)]"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {message ? (
        <div
          className="rounded-xl border-4 border-[var(--mks-pink)] bg-[var(--mks-pink)]/10 px-4 py-3 text-sm font-bold text-[var(--mks-ink)]"
          role="alert"
        >
          {message}
        </div>
      ) : null}

      <ul className="space-y-4">
        {lines.map((line) => (
          <li
            key={line.versionId}
            className="flex flex-col gap-4 rounded-xl border-4 border-[var(--mks-ink)] bg-white p-4 shadow-[6px_6px_0_0_var(--mks-ink)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link
                href={`/catalogo/${line.slug}`}
                className="font-heading text-base font-black text-[var(--mks-ink)] hover:underline"
              >
                {line.name}
              </Link>
              <p className="mt-1 text-sm font-black text-[var(--mks-pink)]">
                {formatMoney(line.price, line.currency)} c/u
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy === line.versionId}
                className="h-10 min-w-10 rounded-lg border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] text-lg font-black disabled:opacity-50"
                onClick={() => void setQty(line, line.quantity - 1)}
                aria-label="Quitar una unidad"
              >
                −
              </button>
              <span className="w-10 text-center font-black">{line.quantity}</span>
              <button
                type="button"
                disabled={busy === line.versionId}
                className="h-10 min-w-10 rounded-lg border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] text-lg font-black disabled:opacity-50"
                onClick={() => void setQty(line, line.quantity + 1)}
                aria-label="Añadir una unidad"
              >
                +
              </button>
              <button
                type="button"
                disabled={busy === line.versionId}
                className="ml-2 rounded-lg border-2 border-[var(--mks-ink)] px-3 py-2 text-xs font-black uppercase text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
                onClick={() => void setQty(line, 0)}
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border-4 border-dashed border-[var(--mks-ink)] bg-[var(--mks-cream)] p-6 pb-28 space-y-4 lg:pb-6">
        <p className="text-sm text-neutral-600">
          Subtotal referencial:{" "}
          <span className="font-black text-[var(--mks-ink)]">{formatMoney(subtotal, lines[0]?.currency ?? "COP")}</span>
          . El checkout confirmará totales en la moneda de tu mercado y te redirigirá a Mercado Pago.
        </p>
        <Link
          href="/checkout"
          className="hidden items-center justify-center rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-6 py-3 text-sm font-black uppercase tracking-wide text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none lg:inline-flex"
        >
          Ir al checkout
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]/95 p-4 pb-safe backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm font-black text-[var(--mks-ink)]">
            {formatMoney(subtotal, lines[0]?.currency ?? "COP")}
          </p>
          <Link
            href="/checkout"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]"
          >
            Ir al checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
