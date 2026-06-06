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

  // #region agent log
  fetch("http://127.0.0.1:7801/ingest/7171c2d7-123f-4eec-957b-9607ec2a1858", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1e5e6c" },
    body: JSON.stringify({
      sessionId: "1e5e6c",
      location: "layout.tsx:PublicLayout",
      message: "layout siteSettings",
      data: {
        heroTitle: siteSettings.hero.title ?? null,
        colorPink: siteSettings.brand_colors.pink ?? null,
        cssVarCount: Object.keys(siteSettings.brand_colors).filter(
          (k) => siteSettings.brand_colors[k as keyof typeof siteSettings.brand_colors],
        ).length,
      },
      timestamp: Date.now(),
      hypothesisId: "C",
    }),
  }).catch(() => {});
  // #endregion

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
