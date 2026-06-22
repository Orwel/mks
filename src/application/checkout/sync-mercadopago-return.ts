import {
  fulfillPaidOrder,
  markOrderPaymentFailed,
} from "@/application/checkout/fulfill-paid-order";
import {
  getMercadoPagoPayment,
  isMercadoPagoConfigured,
} from "@/infrastructure/payments/mercadopago-client";

async function resolvePayment(
  orderId: string,
  paymentId?: string | null,
): Promise<{ id: string; status?: string; status_detail?: string } | null> {
  const paymentApi = getMercadoPagoPayment();

  if (paymentId?.trim()) {
    const payment = await paymentApi.get({ id: paymentId.trim() });
    return payment?.id
      ? {
          id: String(payment.id),
          status: payment.status,
          status_detail: payment.status_detail,
        }
      : null;
  }

  const search = await paymentApi.search({
    options: { external_reference: orderId },
  });
  const results = (search as { results?: { id?: number; status?: string; status_detail?: string }[] })
    .results;
  const latest = results?.[0];
  if (!latest?.id) return null;
  return {
    id: String(latest.id),
    status: latest.status,
    status_detail: latest.status_detail,
  };
}

/** Sincroniza estado del pedido al volver de Checkout Pro (sustituto de webhook en localhost). */
export async function syncMercadoPagoOrderFromReturn(input: {
  orderId: string;
  paymentId?: string | null;
  collectionStatus?: string | null;
}): Promise<{ synced: boolean; mpStatus?: string }> {
  if (!isMercadoPagoConfigured()) {
    return { synced: false };
  }

  try {
    const payment = await resolvePayment(input.orderId, input.paymentId);

    if (!payment?.id) {
      return { synced: false };
    }

    const status = payment.status ?? input.collectionStatus ?? undefined;

    if (status === "approved") {
      await fulfillPaidOrder({
        orderId: input.orderId,
        paymentExternalId: payment.id,
      });
      return { synced: true, mpStatus: "approved" };
    }

    if (status === "rejected" || status === "cancelled") {
      await markOrderPaymentFailed(input.orderId);
      return { synced: true, mpStatus: status };
    }

    return { synced: false, mpStatus: status };
  } catch {
    return { synced: false };
  }
}

export function isMercadoPagoReturnStatus(status: string | undefined): boolean {
  if (!status) return false;
  return ["success", "pending", "approved", "in_process", "failure"].includes(status);
}
