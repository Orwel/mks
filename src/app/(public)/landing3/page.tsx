import {
  filterHeroDestacados,
  getLandingPageDataCached,
} from "@/infrastructure/supabase/queries/landing";
import { FeaturedByCategory } from "@/presentation/components/landing/featured-by-category";
import { LandingHeroVariant3 } from "@/presentation/components/landing/hero-landing-variant-3";

export default async function Landing3Page() {
  const landing = await getLandingPageDataCached();
  const heroDestacados = filterHeroDestacados(landing.banners);

  return (
    <>
      <LandingHeroVariant3 heroBanners={heroDestacados} />
      <FeaturedByCategory
        categories={landing.categories}
        products={landing.featured}
      />
    </>
  );
}
