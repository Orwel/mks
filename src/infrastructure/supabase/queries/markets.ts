import { cache } from "react";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { MKS_MARKET_COOKIE } from "@/shared/constants/market-cookie";
import type { RateToCopMap } from "@/shared/lib/money/convert-amount";
import { cookies } from "next/headers";

export type MarketRow = {
  code: string;
  name: string;
  default_currency: string;
  default_locale: string;
  default_payment_provider: "mercadopago";
  flag_emoji: string | null;
  sort_order: number;
  is_active: boolean;
};

export type CurrencyRow = {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  zero_decimal: boolean;
  stripe_presentment: boolean;
  mercadopago_supported: boolean;
};

export async function getActiveMarkets(): Promise<MarketRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("markets")
      .select(
        "code, name, default_currency, default_locale, default_payment_provider, flag_emoji, sort_order, is_active",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as MarketRow[];
  } catch {
    return [];
  }
}

export const getActiveMarketsCached = cache(getActiveMarkets);

export async function getMarketByCode(code: string): Promise<MarketRow | null> {
  const markets = await getActiveMarketsCached();
  return markets.find((m) => m.code === code) ?? null;
}

/** Incluye mercados inactivos (admin / validación). */
export async function getMarketByCodeAny(code: string): Promise<MarketRow | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("markets")
      .select(
        "code, name, default_currency, default_locale, default_payment_provider, flag_emoji, sort_order, is_active",
      )
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();
    return (data as MarketRow | null) ?? null;
  } catch {
    return null;
  }
}

export async function getMarketCodeFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(MKS_MARKET_COOKIE)?.value?.trim();
  if (!raw) return null;
  const market = await getMarketByCode(raw);
  return market?.code ?? null;
}

export async function resolveCurrentMarket(): Promise<MarketRow | null> {
  const code = await getMarketCodeFromCookies();
  if (!code) return null;
  return getMarketByCode(code);
}

export async function getCurrencyRatesMap(): Promise<RateToCopMap> {
  try {
    const supabase = await createSupabaseServerClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("currency_rates")
      .select("currency, rate_to_cop, rate_date")
      .lte("rate_date", today)
      .order("rate_date", { ascending: false });
    const map: RateToCopMap = { COP: 1 };
    for (const row of data ?? []) {
      const c = String(row.currency).toUpperCase();
      if (map[c] === undefined) {
        map[c] = Number(row.rate_to_cop);
      }
    }
    return map;
  } catch {
    return { COP: 1 };
  }
}

export const getCurrencyRatesMapCached = cache(getCurrencyRatesMap);

export async function getCatalogCurrencies(): Promise<CurrencyRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("currencies")
      .select(
        "code, name, symbol, decimal_places, zero_decimal, stripe_presentment, mercadopago_supported",
      )
      .eq("is_active", true)
      .order("code", { ascending: true });
    return (data ?? []) as CurrencyRow[];
  } catch {
    return [];
  }
}

export async function getMercadoPagoCurrencies(): Promise<CurrencyRow[]> {
  const all = await getCatalogCurrencies();
  return all.filter((c) => c.mercadopago_supported);
}
