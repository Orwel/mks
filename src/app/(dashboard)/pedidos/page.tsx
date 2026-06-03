import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { OrdersAdmin, type OrderAdminRow } from "@/presentation/components/dashboard/orders-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

export default async function DashboardPedidosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, currency, customer_name, created_at")
    .order("created_at", { ascending: false });

  const rows = (orders ?? []) as OrderAdminRow[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Pedidos"
        description="Bandeja operativa. Cambia el estado y se registra en order_status_history."
      />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}
      <OrdersAdmin orders={rows} />
    </div>
  );
}
