import { getSiteSettingsCached } from "@/infrastructure/supabase/queries/site-settings";
import { AppearanceAdmin } from "@/presentation/components/dashboard/appearance-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

export default async function AparienciaPage() {
  const settings = await getSiteSettingsCached();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Apariencia"
        description="Colores, textos del hero, footer y botones — sin tocar código."
      />
      <AppearanceAdmin settings={settings} />
    </div>
  );
}
