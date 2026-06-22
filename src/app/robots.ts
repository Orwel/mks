import type { MetadataRoute } from "next";

import { siteConfig } from "@/shared/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/login",
        "/registro",
        "/recuperar",
        "/mi-cuenta",
        "/mis-pedidos",
        "/checkout",
        "/carrito",
        "/pedido/",
      ],
    },
    host: new URL(siteConfig.url).host,
  };
}
