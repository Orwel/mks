import { isLocalSiteUrl } from "@/application/checkout/site-url";
import {
  getMercadoPagoPreference,
  isMercadoPagoSandboxMode,
  resolveMercadoPagoInitPoint,
  sandboxPayerEmail,
} from "@/infrastructure/payments/mercadopago-client";

function splitPayerName(fullName: string): { name: string; surname?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { name: parts[0] ?? "Cliente" };
  return { name: parts[0]!, surname: parts.slice(1).join(" ") };
}

export async function createMercadoPagoPreference(input: {
  orderId: string;
  orderNumber: string;
  currency: string;
  customerEmail: string;
  customerName: string;
  items: { title: string; quantity: number; unitPrice: number }[];
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
  const payerEmail = sandboxMode ? sandboxPayerEmail(input.customerEmail) : input.customerEmail;
  const payerName = splitPayerName(input.customerName);

  const result = await preference.create({
    body: {
      items: input.items.map((item) => ({
        id: item.title.slice(0, 40),
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: input.currency,
      })),
      ...(sandboxMode
        ? {}
        : {
            payer: {
              email: payerEmail,
              name: payerName.name,
              ...(payerName.surname ? { surname: payerName.surname } : {}),
            },
          }),
      external_reference: input.orderId,
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
