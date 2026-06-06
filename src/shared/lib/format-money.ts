export function formatMoney(
  value: number,
  currency: string,
  locale = "es-CO",
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "COP",
      maximumFractionDigits: currency === "COP" || currency === "CLP" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
