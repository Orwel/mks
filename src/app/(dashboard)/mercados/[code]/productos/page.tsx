import { notFound } from "next/navigation";

import {
  getMarketByCodeOrNull,
  getMarketProductsAdmin,
} from "@/infrastructure/supabase/queries/product-versions";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { MarketProductsAdmin } from "@/presentation/components/dashboard/market-products-admin";
import {
  buildCategoryTree,
  type CategoryTreeRow,
} from "@/presentation/components/dashboard/category-tree-utils";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function MarketProductosPage({ params }: Props) {
  const { code } = await params;
  const marketCode = code.toUpperCase();
  const market = await getMarketByCodeOrNull(marketCode);

  if (!market) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: categories, error: catErr }, products] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, parent_id, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    getMarketProductsAdmin(marketCode),
  ]);

  const categoryRows: CategoryTreeRow[] = (categories ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    parent_id: (c.parent_id as string | null) ?? null,
    sort_order: Number(c.sort_order),
  }));
  const categoryTree = buildCategoryTree(categoryRows);
  const flag = market.flag_emoji ? `${market.flag_emoji} ` : "";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Productos — ${flag}${market.name}`}
        description={`Inventario y versiones para el mercado ${marketCode}. El precio y stock se gestionan por versión en ${market.default_currency}.`}
      />

      {catErr ? <p className="text-sm font-bold text-[var(--mks-pink)]">{catErr.message}</p> : null}

      <MarketProductsAdmin
        marketCode={marketCode}
        marketName={market.name}
        marketFlag={market.flag_emoji}
        marketCurrency={market.default_currency}
        products={products}
        categoryTree={categoryTree}
      />
    </div>
  );
}
