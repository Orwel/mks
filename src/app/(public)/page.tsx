import { getLandingPageDataCached } from "@/infrastructure/supabase/queries/landing";
import { FeaturedByCategory } from "@/presentation/components/landing/featured-by-category";
import { LandingAnnouncement } from "@/presentation/components/landing/landing-announcement";
import { LandingBanners } from "@/presentation/components/landing/landing-banners";
import { LandingHero } from "@/presentation/components/landing/hero";

export default async function HomePage() {
  const landing = await getLandingPageDataCached();

  return (
    <>
      <LandingHero />
      <LandingBanners banners={landing.banners} />
      <FeaturedByCategory products={landing.featured} />
      <LandingAnnouncement announcement={landing.announcement} />
    </>
  );
}
