import { getSiteUrl } from "@/application/checkout/site-url";
import { getMercadoPagoPreference } from "@/infrastructure/payments/mercadopago-client";

export async function createMercadoPagoPreference(input: {
  orderId: string;
  orderNumber: string;
  currency: string;
  customerEmail: string;
  customerName: string;
  items: { title: string; quantity: number; unitPrice: number }[];
}): Promise<{ initPoint: string; preferenceId: string }> {
  const preference = getMercadoPagoPreference();
  const siteUrl = getSiteUrl();

  const result = await preference.create({
    body: {
      items: input.items.map((item) => ({
        id: item.title.slice(0, 40),
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: input.currency,
      })),
      payer: {
        email: input.customerEmail,
        name: input.customerName,
      },
      external_reference: input.orderId,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${siteUrl}/pedido/${encodeURIComponent(input.orderNumber)}?status=success`,
        failure: `${siteUrl}/checkout?cancelled=1`,
        pending: `${siteUrl}/pedido/${encodeURIComponent(input.orderNumber)}?status=pending`,
      },
      auto_return: "approved",
    },
  });

  const initPoint = result.init_point ?? result.sandbox_init_point;
  const preferenceId = result.id;
  if (!initPoint || !preferenceId) {
    throw new Error("Mercado Pago no devolvió init_point.");
  }

  return { initPoint, preferenceId: String(preferenceId) };
}
