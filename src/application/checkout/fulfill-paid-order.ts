import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

export async function recordWebhookEvent(input: {
  provider: "stripe" | "mercadopago";
  externalId: string;
  payload: Record<string, unknown>;
}): Promise<{ isNew: boolean }> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("webhook_events")
    .insert({
      provider: input.provider,
      external_id: input.externalId,
      payload: input.payload,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { isNew: false };
    }
    throw error;
  }
  return { isNew: Boolean(data?.id) };
}

export async function markWebhookProcessed(externalId: string, provider: "stripe" | "mercadopago") {
  const admin = createSupabaseAdminClient();
  await admin
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider", provider)
    .eq("external_id", externalId);
}

export async function fulfillPaidOrder(input: {
  orderId: string;
  paymentExternalId: string;
  provider: "stripe" | "mercadopago";
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();

  await admin
    .from("orders")
    .update({
      payment_external_id: input.paymentExternalId,
      payment_provider: input.provider,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.orderId);

  const { data, error } = await admin.rpc("fulfill_order_payment", {
    p_order_id: input.orderId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string; already_paid?: boolean } | null;
  if (payload?.ok === false) {
    return { ok: false, error: payload.error ?? "fulfill_failed" };
  }

  return { ok: true };
}

export async function markOrderPaymentFailed(orderId: string) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("orders")
    .update({
      payment_status: "failed",
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}
