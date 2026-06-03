import type { CurrencyMeta } from "./currency-meta";

/** Tasas: unidades de moneda → COP (1 USD = rate USD). */
export type RateToCopMap = Record<string, number>;

export function roundForCurrency(amount: number, meta: Pick<CurrencyMeta, "decimalPlaces">): number {
  const factor = 10 ** meta.decimalPlaces;
  return Math.round(amount * factor) / factor;
}

export function toCop(amount: number, currency: string, rates: RateToCopMap): number | null {
  const code = currency.toUpperCase();
  if (code === "COP") return amount;
  const rate = rates[code];
  if (!rate || rate <= 0) return null;
  return amount * rate;
}

export function fromCop(amountCop: number, currency: string, rates: RateToCopMap): number | null {
  const code = currency.toUpperCase();
  if (code === "COP") return amountCop;
  const rate = rates[code];
  if (!rate || rate <= 0) return null;
  return amountCop / rate;
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: RateToCopMap,
): number | null {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return amount;
  const cop = toCop(amount, from, rates);
  if (cop === null) return null;
  return fromCop(cop, to, rates);
}

export function toMinorUnits(
  amount: number,
  meta: Pick<CurrencyMeta, "decimalPlaces" | "zeroDecimal">,
): number {
  if (meta.zeroDecimal || meta.decimalPlaces === 0) {
    return Math.round(amount);
  }
  return Math.round(amount * 10 ** meta.decimalPlaces);
}
