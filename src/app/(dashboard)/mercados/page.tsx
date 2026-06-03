import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getCatalogCurrencies } from "@/infrastructure/supabase/queries/markets";
import { MarketsAdmin, type MarketAdminRow } from "@/presentation/components/dashboard/markets-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

export default async function MercadosPage() {
  const supabase = await createSupabaseServerClient();
  const [marketsRes, currencies] = await Promise.all([
    supabase
      .from("markets")
      .select(
        "code, name, default_currency, default_locale, default_payment_provider, flag_emoji, sort_order, is_active",
      )
      .order("sort_order", { ascending: true }),
    getCatalogCurrencies(),
  ]);

  const markets = (marketsRes.data ?? []) as MarketAdminRow[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Mercados"
        description="Países o regiones: moneda de cobro y pasarela (Stripe / Mercado Pago)."
      />
      {marketsRes.error ? (
        <p className="text-sm font-bold text-[var(--mks-pink)]">{marketsRes.error.message}</p>
      ) : null}
      <MarketsAdmin markets={markets} currencies={currencies} />
    </div>
  );
}
