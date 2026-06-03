import { getLandingPageDataCached } from "@/infrastructure/supabase/queries/landing";
import {
  getActiveMarketsCached,
  getMarketCodeFromCookies,
} from "@/infrastructure/supabase/queries/markets";
import { getSiteSettingsCached } from "@/infrastructure/supabase/queries/site-settings";
import { LandingAnnouncement } from "@/presentation/components/landing/landing-announcement";
import { LandingTicker } from "@/presentation/components/landing/landing-ticker";
import { MarketGateModal } from "@/presentation/components/layout/market-gate-modal";
import { SiteFooter } from "@/presentation/components/layout/site-footer";
import { SiteHeader } from "@/presentation/components/layout/site-header";
import { SiteThemeStyle } from "@/presentation/components/layout/site-theme-style";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [markets, marketCode, siteSettings] = await Promise.all([
    getActiveMarketsCached(),
    getMarketCodeFromCookies(),
    getSiteSettingsCached(),
  ]);

  const landing = await getLandingPageDataCached(marketCode);
  const showGate = !marketCode && markets.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteThemeStyle settings={siteSettings} />
      {showGate ? <MarketGateModal markets={markets} /> : null}
      <LandingTicker messages={landing.tickers} />
      <SiteHeader markets={markets} currentMarketCode={marketCode} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={siteSettings.footer} />
      <LandingAnnouncement announcements={landing.announcements} />
    </div>
  );
}
