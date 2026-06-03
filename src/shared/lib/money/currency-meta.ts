export type CurrencyMeta = {
  code: string;
  decimalPlaces: number;
  zeroDecimal: boolean;
};

export function currencyMetaFromRow(row: {
  code: string;
  decimal_places: number;
  zero_decimal: boolean;
}): CurrencyMeta {
  return {
    code: row.code.trim(),
    decimalPlaces: row.decimal_places,
    zeroDecimal: row.zero_decimal,
  };
}
