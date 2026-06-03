import { getSiteUrl } from "@/application/checkout/site-url";
import { getStripeClient } from "@/infrastructure/payments/stripe-client";
import { toMinorUnits } from "@/shared/lib/money/convert-amount";
import type { CurrencyMeta } from "@/shared/lib/money/currency-meta";

export async function createStripeCheckoutSession(input: {
  orderId: string;
  orderNumber: string;
  currency: string;
  total: number;
  currencyMeta: CurrencyMeta;
  customerEmail: string;
  lineDescriptions: { name: string; quantity: number; unitAmount: number }[];
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripeClient();
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    currency: input.currency.toLowerCase(),
    line_items: input.lineDescriptions.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: input.currency.toLowerCase(),
        unit_amount: toMinorUnits(line.unitAmount, input.currencyMeta),
        product_data: { name: line.name },
      },
    })),
    metadata: {
      order_id: input.orderId,
      order_number: input.orderNumber,
    },
    success_url: `${siteUrl}/pedido/${encodeURIComponent(input.orderNumber)}?status=success`,
    cancel_url: `${siteUrl}/checkout?cancelled=1`,
  });

  if (!session.url) {
    throw new Error("Stripe no devolvió URL de checkout.");
  }

  return { url: session.url, sessionId: session.id };
}

export async function getStripeSessionPaymentIntent(sessionId: string): Promise<string | null> {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const pi = session.payment_intent;
  if (typeof pi === "string") return pi;
  if (pi && typeof pi === "object" && "id" in pi) return pi.id as string;
  return null;
}
