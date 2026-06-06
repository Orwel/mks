"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { AccountOrderCard, type AccountOrderRow } from "@/presentation/components/account/account-order-card";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

type Props = {
  orders: AccountOrderRow[];
  currentFilter: FilterKey;
};

export function AccountOrdersList({ orders, currentFilter }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function filterHref(key: FilterKey) {
    if (key === "all") return pathname;
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtro", key);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={filterHref(f.key)}
            className={cn(
              "rounded-lg border-2 border-[var(--mks-ink)] px-3 py-1.5 text-xs font-black uppercase tracking-wide transition",
              currentFilter === f.key
                ? "bg-[var(--mks-pink)] text-white"
                : "bg-white text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-white/60 p-8 text-center">
          <p className="font-heading text-lg font-black text-[var(--mks-ink)]">Sin pedidos</p>
          <p className="mt-2 text-sm font-medium text-neutral-600">
            No hay pedidos con este filtro. Prueba otro o explora el catálogo.
          </p>
          <Link
            href="/catalogo"
            className="mt-4 inline-block text-sm font-black text-[var(--mks-pink)] hover:underline"
          >
            Ir a la tienda →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <AccountOrderCard order={order} showStepper />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
