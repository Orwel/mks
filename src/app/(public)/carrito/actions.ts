"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  CART_RESERVATION_TTL_MINUTES,
  MKS_CART_ID_COOKIE,
} from "@/shared/constants/cart";

export type ReserveResult =
  | { ok: true }
  | { ok: false; error: string };

async function getOrCreateCartId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(MKS_CART_ID_COOKIE)?.value;
  if (existing && existing.length >= 8) {
    return existing;
  }
  const id = randomUUID();
  jar.set(MKS_CART_ID_COOKIE, id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 400,
    httpOnly: false,
  });
  return id;
}

export async function reserveCartLine(input: {
  productId: string;
  quantity: number;
}): Promise<ReserveResult> {
  const qty = Math.floor(Number(input.quantity));
  if (qty < 1) {
    return { ok: false, error: "invalid_quantity" };
  }

  const supabase = await createSupabaseServerClient();
  const cartId = await getOrCreateCartId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc("reserve_stock", {
    p_product_id: input.productId,
    p_quantity: qty,
    p_cart_id: cartId,
    p_user_id: user?.id ?? null,
    p_ttl_minutes: CART_RESERVATION_TTL_MINUTES,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (payload && payload.ok === false) {
    return { ok: false, error: payload.error ?? "reserve_failed" };
  }

  return { ok: true };
}

export async function releaseCartLine(input: { productId: string }): Promise<ReserveResult> {
  const supabase = await createSupabaseServerClient();
  const jar = await cookies();
  const cartId = jar.get(MKS_CART_ID_COOKIE)?.value;
  if (!cartId) {
    return { ok: true };
  }

  const { data, error } = await supabase.rpc("release_stock_reservation", {
    p_cart_id: cartId,
    p_product_id: input.productId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (payload && payload.ok === false) {
    return { ok: false, error: payload.error ?? "release_failed" };
  }

  return { ok: true };
}

export async function syncCartReservations(
  lines: { productId: string; quantity: number }[],
): Promise<ReserveResult> {
  for (const line of lines) {
    const r = await reserveCartLine({
      productId: line.productId,
      quantity: line.quantity,
    });
    if (!r.ok) {
      return r;
    }
  }
  return { ok: true };
}
