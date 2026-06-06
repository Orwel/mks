import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { AccountOrderRow } from "@/presentation/components/account/account-order-card";
import { ACTIVE_ORDER_STATUSES } from "@/shared/lib/order-status-labels";

type OrderRowDb = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
  order_items: { count: number }[] | null;
};

function mapOrderRow(row: OrderRowDb): AccountOrderRow {
  const count = row.order_items?.[0]?.count;
  return {
    id: row.id,
    order_number: row.order_number,
    status: row.status,
    total: Number(row.total),
    currency: row.currency,
    created_at: row.created_at,
    item_count: count ?? undefined,
  };
}

const ORDER_LIST_SELECT =
  "id, order_number, status, total, currency, created_at, order_items(count)";

export async function listAccountOrders(
  userId: string,
  options?: { limit?: number; statusFilter?: "active" | "delivered" | "cancelled" },
): Promise<AccountOrderRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
    .eq("user_id", userId)
    .neq("status", "cart")
    .order("created_at", { ascending: false });

  if (options?.statusFilter === "active") {
    query = query.in("status", ACTIVE_ORDER_STATUSES);
  } else if (options?.statusFilter === "delivered") {
    query = query.eq("status", "delivered");
  } else if (options?.statusFilter === "cancelled") {
    query = query.in("status", ["cancelled", "refunded"]);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as OrderRowDb[]).map(mapOrderRow);
}

export async function getFeaturedActiveOrder(userId: string): Promise<AccountOrderRow | null> {
  const orders = await listAccountOrders(userId, {
    limit: 1,
    statusFilter: "active",
  });
  return orders[0] ?? null;
}

export type AccountOrderDetail = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  market_code: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    version_name: string | null;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }[];
  history: {
    from_status: string | null;
    to_status: string;
    reason: string | null;
    created_at: string;
  }[];
};

export async function getAccountOrderDetail(
  userId: string,
  orderId: string,
): Promise<AccountOrderDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, subtotal, shipping, discount, total, currency, market_code, customer_name, customer_email, customer_phone, shipping_address, notes, created_at",
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .neq("status", "cart")
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, version_name, unit_price, quantity, subtotal")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const { data: history } = await supabase
    .from("order_status_history")
    .select("from_status, to_status, reason, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    discount: Number(order.discount),
    total: Number(order.total),
    currency: order.currency,
    market_code: order.market_code,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    shipping_address: order.shipping_address as Record<string, unknown> | null,
    notes: order.notes,
    created_at: order.created_at,
    items: (items ?? []).map((it) => ({
      id: it.id,
      product_name: it.product_name,
      version_name: it.version_name,
      unit_price: Number(it.unit_price),
      quantity: it.quantity,
      subtotal: Number(it.subtotal),
    })),
    history: (history ?? []).map((h) => ({
      from_status: h.from_status,
      to_status: h.to_status,
      reason: h.reason,
      created_at: h.created_at,
    })),
  };
}
