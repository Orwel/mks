import Link from "next/link";
import { Suspense } from "react";

import { requireAuth } from "@/infrastructure/supabase/auth-session";
import { listAccountOrders } from "@/infrastructure/supabase/queries/account-orders";
import { AccountOrdersList } from "@/presentation/components/account/account-orders-list";

type FilterKey = "all" | "active" | "delivered" | "cancelled";

function parseFilter(raw: string | string[] | undefined): FilterKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "active" || value === "delivered" || value === "cancelled") return value;
  return "all";
}

export default async function MisPedidosPage({
  searchParams,
}: {
  searchParams?: Promise<{ filtro?: string | string[] }>;
}) {
  const session = await requireAuth();
  const params = searchParams ? await searchParams : {};
  const filter = parseFilter(params.filtro);

  const orders = await listAccountOrders(session.user.id, {
    statusFilter: filter === "all" ? undefined : filter,
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/mi-cuenta"
          className="text-xs font-black uppercase tracking-wide text-[var(--mks-pink)] hover:underline"
        >
          ← Mi cuenta
        </Link>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-cyan)]">
          Tu espacio
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
          Mis pedidos
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Historial y seguimiento de todas tus compras.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-xl border-4 border-[var(--mks-ink)]/20 bg-white/60" />
        }
      >
        <AccountOrdersList orders={orders} currentFilter={filter} />
      </Suspense>
    </div>
  );
}
