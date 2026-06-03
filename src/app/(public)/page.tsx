import {
  filterHeroDestacados,
  getLandingPageDataCached,
} from "@/infrastructure/supabase/queries/landing";
import { FeaturedByCategory } from "@/presentation/components/landing/featured-by-category";
import { LandingHero } from "@/presentation/components/landing/hero";

export default async function HomePage() {
  const landing = await getLandingPageDataCached();
  const heroDestacados = filterHeroDestacados(landing.banners);

  return (
    <>
      <LandingHero heroDestacados={heroDestacados} />
      <FeaturedByCategory
        categories={landing.categories}
        products={landing.featured}
      />
    </>
  );
}
