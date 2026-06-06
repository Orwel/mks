"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { startCheckout } from "@/app/(public)/checkout/actions";
import { formatMoney } from "@/shared/lib/format-money";
import { useCartStore } from "@/presentation/stores/cart-store";

type Props = {
  marketLabel: string | null;
  orderCurrency: string | null;
  marketLocale: string;
};

export function CheckoutForm({ marketLabel, orderCurrency, marketLocale }: Props) {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";
  const lines = useCartStore((s) => s.lines);
  const setLines = useCartStore((s) => s.setLines);
  const [hydrated, setHydrated] = useState(() => useCartStore.persist.hasHydrated());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(cancelled ? "Pago cancelado. Puedes intentar de nuevo." : null);

  useEffect(() => {
    if (hydrated) return undefined;
    return useCartStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  const displayCurrency = orderCurrency ?? lines[0]?.currency ?? "COP";
  const subtotal = useMemo(
    () => lines.reduce((acc, l) => acc + l.price * l.quantity, 0),
    [lines],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await startCheckout({
      lines: lines.map((l) => ({
        productId: l.productId,
        versionId: l.versionId,
        quantity: l.quantity,
      })),
      customerName: String(form.get("customer_name") ?? ""),
      customerEmail: String(form.get("customer_email") ?? ""),
      customerPhone: String(form.get("customer_phone") ?? "") || undefined,
      acceptLegal: form.get("accept_legal") === "on",
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLines([]);
    window.location.href = result.redirectUrl;
  }

  if (!hydrated) {
    return <p className="text-sm text-neutral-600">Cargando carrito…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-neutral-700">No hay productos en el carrito.</p>
        <Link
          href="/catalogo"
          className="inline-block rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-4 py-2 text-sm font-black text-white"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_minmax(0,20rem)]">
      <div className="space-y-4">
        <div className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] p-4 text-sm">
          <p>
            <span className="font-black">Mercado:</span> {marketLabel ?? "—"}
          </p>
          <p className="mt-1">
            <span className="font-black">Pago:</span> Mercado Pago en {displayCurrency}
          </p>
        </div>

        <label className="block text-xs font-black uppercase text-neutral-600">
          Nombre completo
          <input name="customer_name" required className="mt-1 w-full rounded-lg border-4 border-[var(--mks-ink)] px-3 py-2" />
        </label>
        <label className="block text-xs font-black uppercase text-neutral-600">
          Email
          <input
            name="customer_email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border-4 border-[var(--mks-ink)] px-3 py-2"
          />
        </label>
        <label className="block text-xs font-black uppercase text-neutral-600">
          Teléfono (opcional)
          <input name="customer_phone" className="mt-1 w-full rounded-lg border-4 border-[var(--mks-ink)] px-3 py-2" />
        </label>

        <label className="flex items-start gap-2 text-sm font-medium">
          <input name="accept_legal" type="checkbox" required className="mt-1 size-4" />
          <span>
            Acepto los{" "}
            <Link href="/terminos" className="font-bold text-[var(--mks-pink)] underline" target="_blank">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="font-bold text-[var(--mks-pink)] underline" target="_blank">
              privacidad
            </Link>
            .
          </span>
        </label>

        {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error}</p> : null}

        <button
          type="submit"
          disabled={pending || !orderCurrency}
          className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-6 py-3 text-sm font-black uppercase shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)] disabled:opacity-50"
        >
          {pending ? "Redirigiendo…" : `Pagar con Mercado Pago (${displayCurrency})`}
        </button>
      </div>

      <aside className="rounded-xl border-4 border-[var(--mks-ink)] bg-white p-4">
        <h2 className="text-xs font-black uppercase tracking-wide text-neutral-500">Resumen</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.versionId} className="flex justify-between gap-2">
              <span>
                {l.name} × {l.quantity}
              </span>
              <span className="shrink-0 font-medium">
                {formatMoney(l.price * l.quantity, l.currency, marketLocale)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t-2 border-neutral-200 pt-3 font-black">
          <span>Total</span>
          <span>{formatMoney(subtotal, displayCurrency, marketLocale)}</span>
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          El cargo en Mercado Pago será en {displayCurrency}, según tu mercado seleccionado.
        </p>
      </aside>
    </form>
  );
}
