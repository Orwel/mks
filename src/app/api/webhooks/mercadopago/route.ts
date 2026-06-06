import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";

import {
  fulfillPaidOrder,
  markOrderPaymentFailed,
  markWebhookProcessed,
  recordWebhookEvent,
} from "@/application/checkout/fulfill-paid-order";
import { getMercadoPagoPayment } from "@/infrastructure/payments/mercadopago-client";
import { getServerEnv } from "@/shared/config/env";

function verifyMercadoPagoSignature(
  request: Request,
  body: { data?: { id?: string } },
  secret: string,
): boolean {
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const dataId = body.data?.id;
  if (!xSignature || !dataId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    }),
  );
  const ts = parts.ts;
  const receivedHash = parts.v1;
  if (!ts || !receivedHash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return expected === receivedHash;
}

export async function POST(request: Request) {
  const { MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET } = getServerEnv();
  if (!MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Mercado Pago no configurado." }, { status: 503 });
  }

  const body = (await request.json()) as {
    action?: string;
    type?: string;
    data?: { id?: string };
  };

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (MP_WEBHOOK_SECRET && !verifyMercadoPagoSignature(request, body, MP_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  const eventKey = `payment-${paymentId}-${body.action ?? "unknown"}`;
  const { isNew } = await recordWebhookEvent({
    provider: "mercadopago",
    externalId: eventKey,
    payload: body as Record<string, unknown>,
  });
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const paymentApi = getMercadoPagoPayment();
    const payment = await paymentApi.get({ id: String(paymentId) });
    const orderId = payment.external_reference;
    if (!orderId) {
      return NextResponse.json({ error: "external_reference missing" }, { status: 422 });
    }

    const status = payment.status;
    if (status === "approved") {
      await fulfillPaidOrder({
        orderId,
        paymentExternalId: String(paymentId),
      });
    } else if (status === "rejected" || status === "cancelled") {
      await markOrderPaymentFailed(orderId);
    }
  } finally {
    await markWebhookProcessed(eventKey, "mercadopago");
  }

  return NextResponse.json({ received: true });
}
