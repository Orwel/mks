import { cache } from "react";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { publicStorageUrl } from "@/shared/lib/public-storage-url";
import { resolveStorageImages } from "@/shared/lib/resolve-storage-images";

export type BannerImage = {
  id: string;
  url: string;
  alt: string | null;
};

export type BannerRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  images: BannerImage[];
  link_url: string | null;
  position: "hero" | "secondary" | "sidebar";
  sort_order: number;
};

export type TickerRow = {
  id: string;
  message: string;
  link_url: string | null;
  sort_order: number;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  display_mode: "modal" | "toast" | "bar";
  frequency: "once_per_session" | "once_per_user" | "always";
  sort_order: number;
};

export type FeaturedProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  available_stock: number;
  category_slug: string;
  category_name: string;
  image_url: string | null;
  images: BannerImage[];
};

export type LandingCategory = {
  id: string;
  slug: string;
  name: string;
  product_count: number;
};

export type LandingPageData = {
  banners: BannerRow[];
  tickers: TickerRow[];
  announcements: AnnouncementRow[];
  categories: LandingCategory[];
  featured: FeaturedProduct[];
};

/** Destacados del panel derecho del hero (tabla `banners`, posición hero). */
export function filterHeroDestacados(banners: BannerRow[]): BannerRow[] {
  return banners.filter((b) => b.position === "hero");
}

function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.length &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
  );
}

function inScheduleWindow(row: {
  starts_at?: string | null;
  ends_at?: string | null;
}): boolean {
  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() < now) return false;
  return true;
}

function matchesMarket(
  rowMarket: string | null | undefined,
  activeMarket: string | null | undefined,
): boolean {
  if (!rowMarket) return true;
  if (!activeMarket) return false;
  return rowMarket === activeMarket;
}

export async function getLandingPageData(
  activeMarketCode?: string | null,
): Promise<LandingPageData> {
  const empty: LandingPageData = {
    banners: [],
    tickers: [],
    announcements: [],
    categories: [],
    featured: [],
  };

  if (!hasSupabaseEnv()) {
    return empty;
  }

  try {
    const supabase = await createSupabaseServerClient();

    const [
      bannersRes,
      tickersRes,
      announcementsRes,
      categoriesRes,
      productsRes,
      productCountsRes,
    ] = await Promise.all([
      supabase
        .from("banners")
        .select(
          "id, title, subtitle, image_url, link_url, position, sort_order, starts_at, ends_at, market_code",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("ticker_messages")
        .select("id, message, link_url, sort_order, starts_at, ends_at, market_code")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("announcements")
        .select(
          "id, title, body, image_url, cta_label, cta_url, display_mode, frequency, sort_order, starts_at, ends_at, market_code",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("categories")
        .select("id, slug, name, sort_order, parent_id")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("products_with_available_stock")
        .select(
          "id, slug, name, price, currency, available_stock, category_id, is_featured, is_active",
        )
        .eq("is_active", true)
        .eq("is_featured", true)
        .gt("available_stock", 0)
        .order("updated_at", { ascending: false })
        .limit(24),
      supabase
        .from("products_with_available_stock")
        .select("category_id")
        .eq("is_active", true),
    ]);

    const bannersRaw = ((bannersRes.data ?? []) as (Omit<BannerRow, "images"> & {
      starts_at?: string | null;
      ends_at?: string | null;
      market_code?: string | null;
    })[])
      .filter(inScheduleWindow)
      .filter((row) => matchesMarket(row.market_code, activeMarketCode));

    const bannerIds = bannersRaw.map((b) => b.id);
    const bannerImagesByBanner = new Map<string, BannerImage[]>();

    if (bannerIds.length > 0) {
      const { data: bannerImageRows } = await supabase
        .from("banner_images")
        .select("id, banner_id, storage_path, alt_text, is_primary, sort_order")
        .in("banner_id", bannerIds)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true });

      for (const row of bannerImageRows ?? []) {
        const bid = row.banner_id as string;
        const list = bannerImagesByBanner.get(bid) ?? [];
        list.push({
          id: row.id as string,
          url: publicStorageUrl("banners", row.storage_path as string),
          alt: (row.alt_text as string | null) ?? null,
        });
        bannerImagesByBanner.set(bid, list);
      }
    }

    const banners: BannerRow[] = bannersRaw.map((row) => {
      const { starts_at, ends_at, ...b } = row;
      void starts_at;
      void ends_at;
      const fromStorage = bannerImagesByBanner.get(b.id) ?? [];
      const images =
        fromStorage.length > 0
          ? fromStorage
          : resolveStorageImages("banners", [], b.image_url).map((img) => ({
              id: img.id,
              url: img.url,
              alt: img.alt,
            }));
      return { ...b, images };
    });

    const tickers = ((tickersRes.data ?? []) as (TickerRow & {
      starts_at?: string | null;
      ends_at?: string | null;
      market_code?: string | null;
    })[])
      .filter(inScheduleWindow)
      .filter((row) => matchesMarket(row.market_code, activeMarketCode))
      .map((row) => {
        const { starts_at, ends_at, ...t } = row;
        void starts_at;
        void ends_at;
        return t;
      });

    const announcements = ((announcementsRes.data ?? []) as (AnnouncementRow & {
      starts_at?: string | null;
      ends_at?: string | null;
      market_code?: string | null;
    })[])
      .filter(inScheduleWindow)
      .filter((row) => matchesMarket(row.market_code, activeMarketCode))
      .map((row) => {
        const { starts_at, ends_at, ...a } = row;
        void starts_at;
        void ends_at;
        return a;
      });

    const categoriesRaw = (categoriesRes.data ?? []).filter(
      (c) => (c as { parent_id?: string | null }).parent_id == null,
    );
    const countByCategory = new Map<string, number>();
    for (const row of productCountsRes.data ?? []) {
      const cid = row.category_id as string;
      countByCategory.set(cid, (countByCategory.get(cid) ?? 0) + 1);
    }

    const categories: LandingCategory[] = categoriesRaw.map((c) => ({
      id: c.id as string,
      slug: c.slug as string,
      name: c.name as string,
      product_count: countByCategory.get(c.id as string) ?? 0,
    }));

    const catMap = new Map<string, { slug: string; name: string }>();
    for (const c of categoriesRaw) {
      catMap.set(c.id as string, {
        slug: c.slug as string,
        name: c.name as string,
      });
    }

    const rawProducts = (productsRes.data ?? []) as {
      id: string;
      slug: string;
      name: string;
      price: number;
      currency: string;
      available_stock: number;
      category_id: string;
    }[];

    const productIds = rawProducts.map((p) => p.id);
    const imagesByProduct = new Map<string, BannerImage[]>();
    if (productIds.length > 0) {
      const { data: images } = await supabase
        .from("product_images")
        .select("id, product_id, storage_path, alt_text, is_primary, sort_order")
        .in("product_id", productIds)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true });

      for (const row of images ?? []) {
        const pid = row.product_id as string;
        const list = imagesByProduct.get(pid) ?? [];
        list.push({
          id: row.id as string,
          url: publicStorageUrl("product-images", row.storage_path as string),
          alt: (row.alt_text as string | null) ?? null,
        });
        imagesByProduct.set(pid, list);
      }
    }

    const featured: FeaturedProduct[] = rawProducts.map((p) => {
      const cat = catMap.get(p.category_id);
      const images = imagesByProduct.get(p.id) ?? [];
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        available_stock: Number(p.available_stock),
        category_slug: cat?.slug ?? "",
        category_name: cat?.name ?? "",
        image_url: images[0]?.url ?? null,
        images,
      };
    });

    return {
      banners,
      tickers,
      announcements,
      categories,
      featured,
    };
  } catch {
    return empty;
  }
}

/** Una sola lectura por request (layout + página). */
export const getLandingPageDataCached = cache(getLandingPageData);
