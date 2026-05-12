import type { OrderStatus } from "@/core/value-objects/order-status";

export interface OrderRepository {
  getByIdForUser(orderId: string, userId: string): Promise<unknown>;
  transitionStatus(orderId: string, to: OrderStatus, actorId: string): Promise<void>;
}
