import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { TickerAdmin, type TickerAdminRow } from "@/presentation/components/dashboard/ticker-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

export default async function DashboardTickerPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("ticker_messages")
    .select("id, message, link_url, sort_order, is_active, starts_at, ends_at")
    .order("sort_order", { ascending: true });

  const messages = (rows ?? []) as TickerAdminRow[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Ticker" description="Mensajes horizontales del landing." />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}
      <TickerAdmin messages={messages} />
    </div>
  );
}
