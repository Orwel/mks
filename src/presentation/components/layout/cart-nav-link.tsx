"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCartStore } from "@/presentation/stores/cart-store";

function cartItemCount(lines: { quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function CartNavLink() {
  const lines = useCartStore((s) => s.lines);
  const count = useMemo(() => cartItemCount(lines), [lines]);
  const [hydrated, setHydrated] = useState(() => useCartStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return undefined;
    return useCartStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, [hydrated]);

  const displayCount = hydrated ? count : 0;

  return (
    <Link
      href="/carrito"
      aria-label={
        displayCount > 0
          ? `Carrito, ${displayCount} ${displayCount === 1 ? "producto" : "productos"}`
          : "Carrito"
      }
      className="relative rounded-lg p-2 text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
    >
      <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} aria-hidden />
      {displayCount > 0 ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-2 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-0.5 text-[0.625rem] font-black leading-none text-white"
          aria-hidden
        >
          {displayCount > 99 ? "99+" : displayCount}
        </span>
      ) : null}
    </Link>
  );
}
