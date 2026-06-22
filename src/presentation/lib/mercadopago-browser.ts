"use client";

import { loadMercadoPago } from "@mercadopago/sdk-js";

import { getClientEnv } from "@/shared/config/env";

declare global {
  interface Window {
    MercadoPago: new (
      publicKey: string,
      options?: { locale?: string },
    ) => unknown;
  }
}

let initialized = false;

/** Inicializa el SDK JS de Mercado Pago en el checkout (public key, no access token). */
export async function initMercadoPagoCheckout(locale: string): Promise<void> {
  const publicKey = getClientEnv().NEXT_PUBLIC_MP_PUBLIC_KEY;
  if (!publicKey || initialized) return;

  await loadMercadoPago();
  new window.MercadoPago(publicKey, { locale });
  initialized = true;
}
