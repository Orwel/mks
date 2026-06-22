import { isLocalSiteUrl } from "@/application/checkout/site-url";
import {
  getMercadoPagoPreference,
  isMercadoPagoSandboxMode,
  resolveMercadoPagoInitPoint,
  sandboxPayerEmail,
} from "@/infrastructure/payments/mercadopago-client";
import type { ShippingAddress } from "@/shared/types/shipping-address";

/** Máx. 13 caracteres — aparece en el resumen de tarjeta del comprador. */
const STATEMENT_DESCRIPTOR = "MYKOREASTORE";

function splitPayerName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    const name = parts[0] ?? "Cliente";
    return { name, surname: name };
  }
  return { name: parts[0]!, surname: parts.slice(1).join(" ") };
}

function buildPayerAddress(shipping: ShippingAddress) {
  const streetLine = [shipping.street, shipping.apartment, shipping.building]
    .filter(Boolean)
    .join(", ")
    .trim();

  return {
    zip_code: shipping.postal_code ?? undefined,
    street_name: streetLine || shipping.city,
    city: shipping.city || undefined,
  };
}

export async function createMercadoPagoPreference(input: {
  orderId: string;
  orderNumber: string;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: ShippingAddress;
  items: { title: string; description: string; quantity: number; unitPrice: number }[];
  siteUrl: string;
}): Promise<{ initPoint: string; preferenceId: string }> {
  const preference = getMercadoPagoPreference();
  const siteUrl = input.siteUrl;

  const backUrls = {
    success: `${siteUrl}/pedido/${encodeURIComponent(input.orderNumber)}?status=success`,
    failure: `${siteUrl}/checkout?cancelled=1`,
    pending: `${siteUrl}/pedido/${encodeURIComponent(input.orderNumber)}?status=pending`,
  };
  const localSite = isLocalSiteUrl(siteUrl);
  const sandboxMode = isMercadoPagoSandboxMode(siteUrl);
  const payerEmail = sandboxMode ? sandboxPayerEmail(input.customerEmail) : input.customerEmail.trim();
  const payerName = splitPayerName(input.customerName);
  const phoneDigits = input.customerPhone?.replace(/\D/g, "") ?? "";

  const result = await preference.create({
    body: {
      items: input.items.map((item) => ({
        id: item.title.slice(0, 40),
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: input.currency,
      })),
      payer: {
        email: payerEmail,
        name: payerName.name,
        surname: payerName.surname,
        address: buildPayerAddress(input.shippingAddress),
        ...(phoneDigits.length >= 7
          ? {
              phone: {
                area_code: phoneDigits.length > 10 ? phoneDigits.slice(0, 3) : "",
                number: phoneDigits.length > 10 ? phoneDigits.slice(3) : phoneDigits,
              },
            }
          : {}),
      },
      external_reference: input.orderId,
      statement_descriptor: STATEMENT_DESCRIPTOR,
      metadata: {
        order_number: input.orderNumber,
        order_id: input.orderId,
      },
      ...(localSite ? {} : { notification_url: `${siteUrl}/api/webhooks/mercadopago` }),
      back_urls: backUrls,
      ...(localSite ? {} : { auto_return: "approved" as const }),
    },
  });

  const initPoint = resolveMercadoPagoInitPoint(result, sandboxMode);
  const preferenceId = result.id;

  if (!initPoint || !preferenceId) {
    throw new Error("Mercado Pago no devolvió init_point.");
  }

  return { initPoint, preferenceId: String(preferenceId) };
}
