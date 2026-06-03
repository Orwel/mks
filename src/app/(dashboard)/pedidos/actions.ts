"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

const ORDER_STATUSES = [
  "cart",
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  reason: string | null,
): Promise<void> {
  if (!isOrderStatus(newStatus)) return;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: current, error: readErr } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (readErr || !current) {
    console.error("[updateOrderStatus] read", readErr?.message);
    return;
  }

  if (current.status === newStatus) return;

  const { error: upErr } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
  if (upErr) {
    console.error("[updateOrderStatus] update", upErr.message);
    return;
  }

  const { error: histErr } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: current.status,
    to_status: newStatus,
    changed_by: user?.id ?? null,
    reason: reason?.trim() || null,
  });
  if (histErr) {
    console.error("[updateOrderStatus] history", histErr.message);
    return;
  }

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
}

export async function updateOrderStatusForm(formData: FormData): Promise<void> {
  const orderId = String(formData.get("order_id") ?? "");
  const newStatus = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!orderId) return;
  await updateOrderStatus(orderId, newStatus, reason || null);
}
