"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { MKS_MARKET_COOKIE, MKS_MARKET_COOKIE_MAX_AGE } from "@/shared/constants/market-cookie";

export async function setVisitorMarket(marketCode: string): Promise<{ ok: boolean; error?: string }> {
  const code = marketCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "invalid_market" };

  const supabase = await createSupabaseServerClient();
  const { data: market } = await supabase
    .from("markets")
    .select("code")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (!market) return { ok: false, error: "market_not_found" };

  const jar = await cookies();
  jar.set(MKS_MARKET_COOKIE, code, {
    path: "/",
    sameSite: "lax",
    maxAge: MKS_MARKET_COOKIE_MAX_AGE,
    httpOnly: false,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ market_code: code }).eq("id", user.id);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
