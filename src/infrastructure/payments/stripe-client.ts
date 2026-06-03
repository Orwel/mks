import Stripe from "stripe";

import { getServerEnv } from "@/shared/config/env";

let stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripe) {
    const { STRIPE_SECRET_KEY } = getServerEnv();
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY no configurada.");
    }
    stripe = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(getServerEnv().STRIPE_SECRET_KEY?.length);
}
