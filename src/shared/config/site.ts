export const siteConfig = {
  name: "My Korea Store",
  shortName: "MKS",
  description: "E-commerce de productos coreanos.",
  defaultLocale: "es-CO",
  defaultCurrency: "COP",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
