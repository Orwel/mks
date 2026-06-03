import { Suspense } from "react";

import {
  getMarketCodeFromCookies,
  getMarketByCode,
} from "@/infrastructure/supabase/queries/markets";
import { CheckoutForm } from "@/presentation/components/checkout/checkout-form";

export default async function CheckoutPage() {
  const marketCode = await getMarketCodeFromCookies();
  const market = marketCode ? await getMarketByCode(marketCode) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-cyan)]">Checkout</p>
      <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)]">
        Finalizar compra
      </h1>
      {!market ? (
        <p className="mt-4 text-sm font-medium text-[var(--mks-pink)]">
          Elige tu mercado en la tienda antes de pagar.
        </p>
      ) : null}
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-neutral-600">Cargando…</p>}>
          <CheckoutForm
            marketLabel={market ? `${market.flag_emoji ?? ""} ${market.name}`.trim() : null}
            paymentProvider={market?.default_payment_provider ?? null}
            orderCurrency={market?.default_currency ?? null}
          />
        </Suspense>
      </div>
    </div>
  );
}
