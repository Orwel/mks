import { processMercadoPagoPayment } from "@/application/checkout/process-mercadopago-payment";
import { isMercadoPagoConfigured } from "@/infrastructure/payments/mercadopago-client";

/** Sincroniza estado del pedido al volver de Checkout Pro. */
export async function syncMercadoPagoOrderFromReturn(input: {
  orderId: string;
  paymentId?: string | null;
  collectionStatus?: string | null;
}): Promise<{ synced: boolean; mpStatus?: string; mpStatusDetail?: string }> {
  if (!isMercadoPagoConfigured()) {
    return { synced: false };
  }

  if (!input.paymentId?.trim()) {
    return { synced: false };
  }

  try {
    const result = await processMercadoPagoPayment(input.paymentId);
    return {
      synced: result.processed,
      mpStatus: result.mpStatus ?? input.collectionStatus ?? undefined,
      mpStatusDetail: result.mpStatusDetail,
    };
  } catch {
    return { synced: false };
  }
}

export function isMercadoPagoReturnStatus(status: string | undefined): boolean {
  if (!status) return false;
  return ["success", "pending", "approved", "in_process", "failure"].includes(status);
}
