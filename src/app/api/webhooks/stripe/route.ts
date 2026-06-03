import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  fulfillPaidOrder,
  markWebhookProcessed,
  recordWebhookEvent,
} from "@/application/checkout/fulfill-paid-order";
import { getStripeSessionPaymentIntent } from "@/application/checkout/stripe-checkout";
import { getServerEnv } from "@/shared/config/env";

export async function POST(request: Request) {
  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = getServerEnv();
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe no configurado." }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Firma ausente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  const { isNew } = await recordWebhookEvent({
    provider: "stripe",
    externalId: event.id,
    payload: event as unknown as Record<string, unknown>,
  });
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (!orderId) {
        return NextResponse.json({ error: "order_id missing" }, { status: 422 });
      }

      const paymentIntentId = await getStripeSessionPaymentIntent(session.id);
      await fulfillPaidOrder({
        orderId,
        paymentExternalId: session.id,
        provider: "stripe",
        stripePaymentIntentId: paymentIntentId,
      });
    }
  } finally {
    await markWebhookProcessed(event.id, "stripe");
  }

  return NextResponse.json({ received: true });
}
