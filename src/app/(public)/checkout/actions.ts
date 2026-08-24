"use server";

import {
  createOrderAndPayment,
  type CheckoutLineInput,
} from "@/application/checkout/create-order-and-payment";
import type { ShippingAddressInput } from "@/shared/types/shipping-address";

export async function startCheckout(input: {
  lines: CheckoutLineInput[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: ShippingAddressInput;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}) {
  return createOrderAndPayment(input);
}
