import type { OrderStatus } from "@/core/value-objects/order-status";

export type OrderStatusMeta = {
  label: string;
  badgeClass: string;
  description: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  cart: {
    label: "Carrito",
    badgeClass: "bg-neutral-100 text-neutral-600",
    description: "Pedido en carrito.",
  },
  pending_payment: {
    label: "Pago pendiente",
    badgeClass: "bg-amber-100 text-amber-900",
    description: "Esperando confirmación de pago.",
  },
  paid: {
    label: "Pago confirmado",
    badgeClass: "bg-emerald-100 text-emerald-900",
    description: "Tu pago fue recibido correctamente.",
  },
  processing: {
    label: "Preparando",
    badgeClass: "bg-[var(--mks-cyan)]/30 text-[var(--mks-ink)]",
    description: "Estamos preparando tu pedido.",
  },
  shipped: {
    label: "En camino",
    badgeClass: "bg-sky-100 text-sky-900",
    description: "Tu pedido va en camino.",
  },
  delivered: {
    label: "Entregado",
    badgeClass: "bg-emerald-200 text-emerald-950",
    description: "Pedido entregado.",
  },
  cancelled: {
    label: "Cancelado",
    badgeClass: "bg-neutral-200 text-neutral-700",
    description: "Este pedido fue cancelado.",
  },
  refunded: {
    label: "Reembolsado",
    badgeClass: "bg-[var(--mks-pink)]/20 text-[var(--mks-ink)]",
    description: "Se procesó un reembolso.",
  },
};

/** Pasos visibles para el cliente en el stepper. */
export const CUSTOMER_ORDER_STEPS = [
  { key: "pending_payment", label: "Pago" },
  { key: "paid", label: "Confirmado" },
  { key: "processing", label: "Preparando" },
  { key: "shipped", label: "En camino" },
  { key: "delivered", label: "Entregado" },
] as const;

const STATUS_STEP_INDEX: Partial<Record<OrderStatus, number>> = {
  pending_payment: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
];

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  return (
    ORDER_STATUS_META[status as OrderStatus] ?? {
      label: status,
      badgeClass: "bg-neutral-100 text-neutral-600",
      description: "",
    }
  );
}

export function getOrderStepIndex(status: string): number {
  return STATUS_STEP_INDEX[status as OrderStatus] ?? -1;
}

export function isTerminalOrderStatus(status: string): boolean {
  return status === "cancelled" || status === "refunded" || status === "delivered";
}

export function isActiveOrderStatus(status: string): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status as OrderStatus);
}
