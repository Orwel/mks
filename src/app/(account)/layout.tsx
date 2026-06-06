import { requireAuth } from "@/infrastructure/supabase/auth-session";
import { isAdminRole } from "@/core/value-objects/user-role";
import {
  getActiveMarketsCached,
  getMarketCodeFromCookies,
} from "@/infrastructure/supabase/queries/markets";
import { SiteHeader } from "@/presentation/components/layout/site-header";

const ACCOUNT_LINKS = [
  { href: "/mi-cuenta", label: "Mi cuenta" },
  { href: "/mis-pedidos", label: "Mis pedidos" },
] as const;

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const [markets, marketCode] = await Promise.all([
    getActiveMarketsCached(),
    getMarketCodeFromCookies(),
  ]);

  return (
    <div className="mks-mobile-nav-offset flex min-h-screen flex-col bg-gradient-to-b from-[var(--mks-cream)] to-white">
      <SiteHeader
        markets={markets}
        currentMarketCode={marketCode}
        accountLinks={ACCOUNT_LINKS}
        showAdminLink={isAdminRole(session.profile.role)}
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
        {children}
      </div>
    </div>
  );
}
