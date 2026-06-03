import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { CategoriesAdmin, type CategoryAdminRow } from "@/presentation/components/dashboard/categories-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

export default async function DashboardCategoriasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, sort_order, is_active, image_url")
    .order("sort_order", { ascending: true });

  const rows = (categories ?? []) as CategoryAdminRow[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Categorías"
        description="CRUD conectado a Supabase. Las políticas RLS permiten escritura solo a administradores."
      />

      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}

      <CategoriesAdmin categories={rows} />
    </div>
  );
}
