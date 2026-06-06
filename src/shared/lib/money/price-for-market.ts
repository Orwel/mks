import type { MarketRow } from "@/infrastructure/supabase/queries/markets";
import type { RateToCopMap } from "@/shared/lib/money/convert-amount";
import { convertAmount, roundForCurrency } from "@/shared/lib/money/convert-amount";
import type { CurrencyMeta } from "@/shared/lib/money/currency-meta";

export type MarketPrice = {
  amount: number;
  currency: string;
  locale: string;
};

export function priceForMarket(input: {
  price: number;
  productCurrency: string;
  market: MarketRow;
  rates: RateToCopMap;
  currencyMeta: CurrencyMeta;
}): MarketPrice | null {
  const target = input.market.default_currency.trim().toUpperCase();
  const converted = convertAmount(
    input.price,
    input.productCurrency.trim(),
    target,
    input.rates,
  );
  if (converted === null) return null;

  return {
    amount: roundForCurrency(converted, input.currencyMeta),
    currency: target,
    locale: input.market.default_locale,
  };
}
