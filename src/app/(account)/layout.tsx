import { requireAuth } from "@/infrastructure/supabase/auth-session";
import { AccountTopBar } from "@/presentation/components/layout/account-top-bar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--mks-cream)] to-white">
      <AccountTopBar />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6">{children}</div>
    </div>
  );
}
