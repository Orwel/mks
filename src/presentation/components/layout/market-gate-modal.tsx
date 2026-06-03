"use client";

import { useTransition } from "react";

import { setVisitorMarket } from "@/app/(public)/market/actions";
import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { cn } from "@/lib/utils";

type Props = {
  markets: MarketRow[];
};

export function MarketGateModal({ markets }: Props) {
  const [pending, startTransition] = useTransition();

  if (markets.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="market-gate-title"
        className="w-full max-w-md rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[8px_8px_0_0_var(--mks-cyan)]"
      >
        <h2
          id="market-gate-title"
          className="font-heading text-xl font-black text-[var(--mks-ink)]"
        >
          ¿Desde dónde nos compras?
        </h2>
        <p className="mt-2 text-sm text-neutral-700">
          Elige tu mercado para ver precios, envíos y contenido acorde a tu país.
        </p>
        <ul className="mt-6 space-y-2">
          {markets.map((m) => (
            <li key={m.code}>
              <button
                type="button"
                disabled={pending}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-4 border-[var(--mks-ink)] px-4 py-3 text-left font-bold transition-colors",
                  "hover:bg-[var(--mks-cream)] disabled:opacity-60",
                )}
                onClick={() => {
                  startTransition(async () => {
                    await setVisitorMarket(m.code);
                    window.location.reload();
                  });
                }}
              >
                <span className="text-xl">{m.flag_emoji ?? "🌐"}</span>
                <span>
                  {m.name}
                  <span className="mt-0.5 block text-xs font-medium text-neutral-500">
                    {m.default_currency}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
