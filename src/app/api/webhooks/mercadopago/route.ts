import { NextResponse } from "next/server";
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";

import { processMercadoPagoPayment } from "@/application/checkout/process-mercadopago-payment";
import {
  markWebhookProcessed,
  recordWebhookEvent,
} from "@/application/checkout/fulfill-paid-order";
import { getServerEnv } from "@/shared/config/env";

function paymentIdFromUrl(url: URL): string | null {
  return (
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    null
  );
}

function paymentIdFromBody(body: { data?: { id?: string | number } }): string | null {
  const id = body.data?.id;
  return id != null ? String(id) : null;
}

function verifySignature(request: Request, dataId: string | null): boolean {
  const { MP_WEBHOOK_SECRET } = getServerEnv();
  if (!MP_WEBHOOK_SECRET) return true;
  if (!request.headers.get("x-signature")) return true;
  if (!dataId) return false;

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret: MP_WEBHOOK_SECRET,
    });
    return true;
  } catch (e) {
    if (e instanceof InvalidWebhookSignatureError) return false;
    throw e;
  }
}

async function handleNotification(request: Request, paymentId: string, payload: Record<string, unknown>) {
  const eventKey = `payment-${paymentId}`;
  const { isNew } = await recordWebhookEvent({
    provider: "mercadopago",
    externalId: eventKey,
    payload,
  });
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await processMercadoPagoPayment(paymentId);
  } finally {
    await markWebhookProcessed(eventKey, "mercadopago");
  }

  return NextResponse.json({ received: true });
}

/** IPN legacy: ?topic=payment&id=123 */
export async function GET(request: Request) {
  const { MP_ACCESS_TOKEN } = getServerEnv();
  if (!MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Mercado Pago no configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const topic = url.searchParams.get("topic");
  const paymentId = paymentIdFromUrl(url);

  if (topic !== "payment" || !paymentId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (!verifySignature(request, paymentId)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  return handleNotification(request, paymentId, {
    topic,
    id: paymentId,
    source: "ipn-get",
  });
}

export async function POST(request: Request) {
  const { MP_ACCESS_TOKEN } = getServerEnv();
  if (!MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Mercado Pago no configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const body = (await request.json()) as {
    action?: string;
    type?: string;
    data?: { id?: string | number };
  };

  const paymentId = paymentIdFromUrl(url) ?? paymentIdFromBody(body);
  if (!paymentId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (!verifySignature(request, paymentId)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  return handleNotification(request, paymentId, {
    ...body,
    source: "webhook-post",
  } as Record<string, unknown>);
}
