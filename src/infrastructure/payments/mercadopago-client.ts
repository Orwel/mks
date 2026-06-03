import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

import { getServerEnv } from "@/shared/config/env";

let mpConfig: MercadoPagoConfig | null = null;

export function getMercadoPagoConfig(): MercadoPagoConfig {
  if (!mpConfig) {
    const { MP_ACCESS_TOKEN } = getServerEnv();
    if (!MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN no configurado.");
    }
    mpConfig = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
  }
  return mpConfig;
}

export function getMercadoPagoPreference(): Preference {
  return new Preference(getMercadoPagoConfig());
}

export function getMercadoPagoPayment(): Payment {
  return new Payment(getMercadoPagoConfig());
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(getServerEnv().MP_ACCESS_TOKEN?.length);
}
