"use client";

import { useTransition } from "react";

import { setVisitorMarket } from "@/app/(public)/market/actions";
import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import { cn } from "@/lib/utils";

type Props = {
  markets: MarketRow[];
  currentCode: string | null;
};

export function SiteMarketSelector({ markets, currentCode }: Props) {
  const [pending, startTransition] = useTransition();
  if (markets.length === 0) return null;

  return (
    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--mks-ink)]">
      <span className="hidden sm:inline">Mercado</span>
      <select
        className={cn(
          "rounded-lg border-2 border-[var(--mks-ink)] bg-white px-2 py-1 text-xs font-bold",
          pending && "opacity-60",
        )}
        value={currentCode ?? ""}
        disabled={pending}
        onChange={(e) => {
          const code = e.target.value;
          if (!code) return;
          startTransition(async () => {
            await setVisitorMarket(code);
            window.location.reload();
          });
        }}
      >
        {!currentCode ? <option value="">—</option> : null}
        {markets.map((m) => (
          <option key={m.code} value={m.code}>
            {m.flag_emoji ? `${m.flag_emoji} ` : ""}
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}
