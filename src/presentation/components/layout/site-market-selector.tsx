"use client";

import { useTransition } from "react";

import { setVisitorMarket } from "@/app/(public)/market/actions";
import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/presentation/stores/cart-store";

type Props = {
  markets: MarketRow[];
  currentCode: string | null;
  compact?: boolean;
  layout?: "inline" | "stacked";
};

export function SiteMarketSelector({
  markets,
  currentCode,
  compact = false,
  layout = "inline",
}: Props) {
  const [pending, startTransition] = useTransition();
  const clearCart = useCartStore((s) => s.clearCart);
  if (markets.length === 0) return null;

  const current = markets.find((m) => m.code === currentCode);

  return (
    <label
      className={cn(
        "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--mks-ink)]",
        layout === "stacked" && "w-full flex-col items-stretch gap-2",
      )}
    >
      {!compact && layout === "inline" ? (
        <span className="hidden sm:inline">Mercado</span>
      ) : null}
      {compact && current ? (
        <span className="sr-only">Mercado: {current.name}</span>
      ) : null}
      <select
        className={cn(
          "rounded-lg border-2 border-[var(--mks-ink)] bg-white py-1 text-xs font-bold",
          compact ? "max-w-[5.5rem] px-1.5" : "px-2",
          layout === "stacked" && "w-full px-3 py-2 text-sm",
          pending && "opacity-60",
        )}
        value={currentCode ?? ""}
        disabled={pending}
        aria-label="Seleccionar mercado"
        onChange={(e) => {
          const code = e.target.value;
          if (!code) return;
          startTransition(async () => {
            const r = await setVisitorMarket(code);
            if (r.ok) {
              clearCart();
              window.location.reload();
            }
          });
        }}
      >
        {!currentCode ? <option value="">—</option> : null}
        {markets.map((m) => (
          <option key={m.code} value={m.code}>
            {compact
              ? `${m.flag_emoji ?? ""} ${m.code}`.trim()
              : `${m.flag_emoji ? `${m.flag_emoji} ` : ""}${m.name}`}
          </option>
        ))}
      </select>
    </label>
  );
}
