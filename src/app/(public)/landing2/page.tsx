import {
  filterHeroDestacados,
  getLandingPageDataCached,
} from "@/infrastructure/supabase/queries/landing";
import { FeaturedByCategory } from "@/presentation/components/landing/featured-by-category";
import { LandingHeroVariant2 } from "@/presentation/components/landing/hero-landing-variant-2";

export default async function Landing2Page() {
  const landing = await getLandingPageDataCached();
  const heroDestacados = filterHeroDestacados(landing.banners);

  return (
    <>
      <LandingHeroVariant2 heroBanners={heroDestacados} />
      <FeaturedByCategory
        categories={landing.categories}
        subcategories={landing.subcategories}
        products={landing.featured}
      />
    </>
  );
}
