"use server";

import {
  createOrderAndPayment,
  type CheckoutLineInput,
} from "@/application/checkout/create-order-and-payment";

export async function startCheckout(input: {
  lines: CheckoutLineInput[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  acceptLegal: boolean;
}) {
  return createOrderAndPayment(input);
}
