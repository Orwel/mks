import { requireAdmin } from "@/infrastructure/supabase/auth-session";
import { DashboardSidebar } from "@/presentation/components/layout/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--mks-cream)]">
      <div className="flex min-h-screen flex-col md:flex-row">
        <DashboardSidebar />
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
