import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  DestacadosAdmin,
  type DestacadoAdminRow,
} from "@/presentation/components/dashboard/destacados-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

export default async function DashboardDestacadosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("banners")
    .select("id, title, subtitle, image_url, link_url, position, sort_order, is_active, starts_at, ends_at")
    .eq("position", "hero")
    .order("sort_order", { ascending: true });

  const items = (rows ?? []) as DestacadoAdminRow[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Destacados"
        description="Imágenes del carrusel del hero en la portada. Ordená por prioridad (menor número = primero). Vigencia opcional."
      />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}
      <DestacadosAdmin items={items} />
    </div>
  );
}
