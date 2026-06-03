import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  AnnouncementsAdmin,
  type AnnouncementAdminRow,
} from "@/presentation/components/dashboard/announcements-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

export default async function DashboardAnunciosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("announcements")
    .select(
      "id, title, body, image_url, cta_label, cta_url, display_mode, frequency, sort_order, is_active, starts_at, ends_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const items = (rows ?? []) as AnnouncementAdminRow[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Anuncios pop-up"
        description="Modales al ingresar al sitio, en orden de prioridad. Los modales se muestran uno tras otro hasta cerrarlos."
      />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}
      <AnnouncementsAdmin items={items} />
    </div>
  );
}
