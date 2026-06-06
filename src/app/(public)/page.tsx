import {
  filterHeroDestacados,
  getLandingPageDataCached,
} from "@/infrastructure/supabase/queries/landing";
import { getMarketCodeFromCookies } from "@/infrastructure/supabase/queries/markets";
import { getSiteSettingsCached } from "@/infrastructure/supabase/queries/site-settings";
import { FeaturedByCategory } from "@/presentation/components/landing/featured-by-category";
import { LandingHero } from "@/presentation/components/landing/hero";

export default async function HomePage() {
  const [marketCode, siteSettings] = await Promise.all([
    getMarketCodeFromCookies(),
    getSiteSettingsCached(),
  ]);
  const landing = await getLandingPageDataCached(marketCode);
  const heroDestacados = filterHeroDestacados(landing.banners);

  return (
    <>
      <LandingHero heroDestacados={heroDestacados} hero={siteSettings.hero} />
      <FeaturedByCategory
        categories={landing.categories}
        subcategories={landing.subcategories}
        products={landing.featured}
      />
    </>
  );
}
