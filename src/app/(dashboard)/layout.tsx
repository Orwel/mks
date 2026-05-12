import { requireStaff } from "@/infrastructure/supabase/auth-session";
import { DashboardTopBar } from "@/presentation/components/layout/dashboard-top-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();

  return (
    <div className="min-h-screen bg-[var(--mks-cream)]">
      <DashboardTopBar showUsersLink={session.profile.role === "admin"} />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">{children}</div>
    </div>
  );
}
