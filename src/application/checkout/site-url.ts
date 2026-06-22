import { headers } from "next/headers";

import { getClientEnv } from "@/shared/config/env";

export function getSiteUrl(): string {
  const url = getClientEnv().NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/** Mercado Pago rechaza auto_return con localhost/127.0.0.1 en back_urls. */
export function isLocalSiteUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Usa el host real del request (Vercel) y cae a env si no hay headers. */
export async function resolveCheckoutSiteUrl(): Promise<{
  siteUrl: string;
  source: "request" | "env";
}> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  if (host) {
    const hostname = host.split(",")[0]?.trim();
    if (hostname) {
      const local =
        hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");
      const proto =
        hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
        (local ? "http" : "https");
      try {
        const siteUrl = new URL(`${proto}://${hostname}`).origin.replace(/\/$/, "");
        return { siteUrl, source: "request" };
      } catch {
        /* usar env */
      }
    }
  }
  return { siteUrl: getSiteUrl(), source: "env" };
}
