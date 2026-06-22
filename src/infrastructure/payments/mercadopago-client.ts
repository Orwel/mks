import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

import { isLocalSiteUrl } from "@/application/checkout/site-url";
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

/** Credenciales de prueba del panel → sandbox; producción → init_point normal. */
export function isMercadoPagoSandboxMode(siteUrl: string): boolean {
  const env = getServerEnv();
  const token = env.MP_ACCESS_TOKEN ?? "";
  if (token.startsWith("TEST-")) return true;
  // Tokens APP_USR de cuentas de prueba no llevan prefijo TEST-; MP_TEST_PAYER_EMAIL lo indica.
  if (env.MP_TEST_PAYER_EMAIL?.trim()) return true;

  const explicit = process.env.MP_SANDBOX?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;

  return isLocalSiteUrl(siteUrl);
}

export function resolveMercadoPagoInitPoint(
  result: { init_point?: string; sandbox_init_point?: string },
  sandboxMode: boolean,
): string | undefined {
  if (sandboxMode) return result.sandbox_init_point ?? result.init_point;
  return result.init_point ?? result.sandbox_init_point;
}

/** Email de cuenta de prueba creada en panel MP (Cuentas de prueba). */
export function isMercadoPagoTestUserEmail(email: string): boolean {
  return /@testuser\.com$/i.test(email.trim());
}

/** En sandbox, opcionalmente usa el email del comprador de prueba del panel MP. */
export function sandboxPayerEmail(customerEmail: string): string {
  const fromEnv = getServerEnv().MP_TEST_PAYER_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  const customer = customerEmail.trim();
  if (isMercadoPagoTestUserEmail(customer)) return customer;
  return customer;
}

export function validateSandboxPayerEmail(customerEmail: string): string | null {
  if (!isMercadoPagoTestUserEmail(sandboxPayerEmail(customerEmail))) {
    return (
      "Modo prueba: el comprador debe ser una cuenta @testuser.com de Mercado Pago " +
      "(panel MKS → Cuentas de prueba → Comprador). Pon ese email en MP_TEST_PAYER_EMAIL " +
      "o en el formulario. En MP sandbox paga con tarjeta de prueba (APRO), sin tu cuenta real."
    );
  }
  return null;
}
