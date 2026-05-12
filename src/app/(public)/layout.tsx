import { getLandingPageDataCached } from "@/infrastructure/supabase/queries/landing";
import { SiteFooter } from "@/presentation/components/layout/site-footer";
import { SiteHeader } from "@/presentation/components/layout/site-header";
import { LandingTicker } from "@/presentation/components/landing/landing-ticker";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const landing = await getLandingPageDataCached();

  return (
    <div className="flex min-h-screen flex-col">
      <LandingTicker messages={landing.tickers} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
