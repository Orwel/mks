import {
  filterHeroDestacados,
  getLandingPageDataCached,
} from "@/infrastructure/supabase/queries/landing";
import { FeaturedByCategory } from "@/presentation/components/landing/featured-by-category";
import { LandingHeroVariant4 } from "@/presentation/components/landing/hero-landing-variant-4";

export default async function Landing4Page() {
  const landing = await getLandingPageDataCached();
  const heroDestacados = filterHeroDestacados(landing.banners);

  return (
    <>
      <LandingHeroVariant4 heroBanners={heroDestacados} />
      <FeaturedByCategory
        categories={landing.categories}
        subcategories={landing.subcategories}
        products={landing.featured}
      />
    </>
  );
}
