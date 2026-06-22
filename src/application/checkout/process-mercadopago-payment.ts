import {
  fulfillPaidOrder,
  markOrderPaymentFailed,
} from "@/application/checkout/fulfill-paid-order";
import { getMercadoPagoPayment } from "@/infrastructure/payments/mercadopago-client";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

type MpPayment = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string | null;
  preference_id?: string | null;
};

async function resolveOrderId(payment: MpPayment): Promise<string | null> {
  const fromPayment = payment.external_reference?.trim();
  if (fromPayment) return fromPayment;

  const preferenceId = payment.preference_id?.trim();
  if (!preferenceId) return null;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id")
    .eq("payment_external_id", preferenceId)
    .maybeSingle();

  return data?.id ? String(data.id) : null;
}

/** Consulta el pago en MP y actualiza el pedido (webhook o vuelta de Checkout Pro). */
export async function processMercadoPagoPayment(paymentId: string): Promise<{
  processed: boolean;
  orderId?: string;
  mpStatus?: string;
  mpStatusDetail?: string;
}> {
  const paymentApi = getMercadoPagoPayment();
  const payment = (await paymentApi.get({ id: paymentId.trim() })) as MpPayment;

  if (!payment?.id) {
    return { processed: false };
  }

  const orderId = await resolveOrderId(payment);
  if (!orderId) {
    return {
      processed: false,
      mpStatus: payment.status,
      mpStatusDetail: payment.status_detail,
    };
  }

  const status = payment.status;
  const paymentExternalId = String(payment.id);

  if (status === "approved") {
    await fulfillPaidOrder({ orderId, paymentExternalId });
    return {
      processed: true,
      orderId,
      mpStatus: status,
      mpStatusDetail: payment.status_detail,
    };
  }

  if (status === "rejected" || status === "cancelled") {
    await markOrderPaymentFailed(orderId);
    return {
      processed: true,
      orderId,
      mpStatus: status,
      mpStatusDetail: payment.status_detail,
    };
  }

  return {
    processed: false,
    orderId,
    mpStatus: status,
    mpStatusDetail: payment.status_detail,
  };
}
