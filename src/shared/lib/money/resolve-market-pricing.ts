import {
  getCurrencyRatesMapCached,
  resolveCurrentMarket,
  type MarketRow,
} from "@/infrastructure/supabase/queries/markets";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { currencyMetaFromRow } from "@/shared/lib/money/currency-meta";
import type { CurrencyMeta } from "@/shared/lib/money/currency-meta";
import { priceForMarket, type MarketPrice } from "@/shared/lib/money/price-for-market";
import type { RateToCopMap } from "@/shared/lib/money/convert-amount";

export type MarketPricingContext = {
  market: MarketRow | null;
  rates: RateToCopMap;
  currencyMeta: CurrencyMeta | null;
};

export async function resolveMarketPricingContext(): Promise<MarketPricingContext> {
  const [market, rates] = await Promise.all([
    resolveCurrentMarket(),
    getCurrencyRatesMapCached(),
  ]);

  if (!market) {
    return { market: null, rates, currencyMeta: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data: currencyRow } = await supabase
    .from("currencies")
    .select("code, decimal_places, zero_decimal")
    .eq("code", market.default_currency)
    .maybeSingle();

  const currencyMeta = currencyRow
    ? currencyMetaFromRow({
        code: String(currencyRow.code),
        decimal_places: Number(currencyRow.decimal_places),
        zero_decimal: Boolean(currencyRow.zero_decimal),
      })
    : null;

  return { market, rates, currencyMeta };
}

export function productPriceForContext(
  ctx: MarketPricingContext,
  product: { price: number; currency: string },
): MarketPrice | null {
  if (!ctx.market || !ctx.currencyMeta) return null;
  return priceForMarket({
    price: product.price,
    productCurrency: product.currency,
    market: ctx.market,
    rates: ctx.rates,
    currencyMeta: ctx.currencyMeta,
  });
}

export type ProductWithDisplayPrice<T> = T & {
  displayPrice: number;
  displayCurrency: string;
  displayLocale: string;
};

export function enrichProductWithDisplayPrice<T extends { price: number; currency: string }>(
  ctx: MarketPricingContext,
  product: T,
): ProductWithDisplayPrice<T> {
  const converted = productPriceForContext(ctx, product);
  if (converted) {
    return {
      ...product,
      displayPrice: converted.amount,
      displayCurrency: converted.currency,
      displayLocale: converted.locale,
    };
  }
  return {
    ...product,
    displayPrice: product.price,
    displayCurrency: product.currency,
    displayLocale: ctx.market?.default_locale ?? "es-CO",
  };
}

export function enrichProductsWithDisplayPrice<T extends { price: number; currency: string }>(
  ctx: MarketPricingContext,
  products: T[],
): ProductWithDisplayPrice<T>[] {
  return products.map((p) => enrichProductWithDisplayPrice(ctx, p));
}
