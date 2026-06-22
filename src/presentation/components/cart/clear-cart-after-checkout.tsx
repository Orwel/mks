"use client";

import { useEffect } from "react";

import { useCartStore } from "@/presentation/stores/cart-store";

/** Vacía el carrito local tras volver de Mercado Pago (no antes de redirigir). */
export function ClearCartAfterCheckout({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    useCartStore.getState().clearCart();
  }, [active]);

  return null;
}
