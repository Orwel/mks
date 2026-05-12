import { cache } from "react";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export type BannerRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
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
};

export type LandingPageData = {
  banners: BannerRow[];
  tickers: TickerRow[];
  announcement: AnnouncementRow | null;
  featured: FeaturedProduct[];
};

function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.length &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
  );
}

function publicStorageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
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

export async function getLandingPageData(): Promise<LandingPageData> {
  const empty: LandingPageData = {
    banners: [],
    tickers: [],
    announcement: null,
    featured: [],
  };

  if (!hasSupabaseEnv()) {
    return empty;
  }

  try {
    const supabase = await createSupabaseServerClient();

    const [bannersRes, tickersRes, announcementRes, productsRes] = await Promise.all([
      supabase
        .from("banners")
        .select(
          "id, title, subtitle, image_url, link_url, position, sort_order, starts_at, ends_at",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("ticker_messages")
        .select("id, message, link_url, sort_order, starts_at, ends_at")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("announcements")
        .select(
          "id, title, body, image_url, cta_label, cta_url, display_mode, frequency, starts_at, ends_at",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
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
    ]);

    const banners = ((bannersRes.data ?? []) as (BannerRow & {
      starts_at?: string | null;
      ends_at?: string | null;
    })[])
      .filter(inScheduleWindow)
      .map(({ starts_at: _s, ends_at: _e, ...b }) => b);

    const tickers = ((tickersRes.data ?? []) as (TickerRow & {
      starts_at?: string | null;
      ends_at?: string | null;
    })[])
      .filter(inScheduleWindow)
      .map(({ starts_at: _s, ends_at: _e, ...t }) => t);

    let announcement: AnnouncementRow | null = null;
    if (announcementRes.data && !announcementRes.error) {
      const a = announcementRes.data as AnnouncementRow & {
        starts_at?: string | null;
        ends_at?: string | null;
      };
      if (inScheduleWindow(a)) {
        announcement = {
          id: a.id,
          title: a.title,
          body: a.body,
          image_url: a.image_url,
          cta_label: a.cta_label,
          cta_url: a.cta_url,
          display_mode: a.display_mode,
          frequency: a.frequency,
        };
      }
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

    const catIds = [...new Set(rawProducts.map((p) => p.category_id))];
    const catMap = new Map<string, { slug: string; name: string }>();

    if (catIds.length > 0) {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, slug, name")
        .in("id", catIds)
        .eq("is_active", true);
      for (const c of cats ?? []) {
        catMap.set(c.id as string, {
          slug: c.slug as string,
          name: c.name as string,
        });
      }
    }

    const productIds = rawProducts.map((p) => p.id);
    const imagesByProduct = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: images } = await supabase
        .from("product_images")
        .select("product_id, storage_path, is_primary, sort_order")
        .in("product_id", productIds)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true });

      for (const row of images ?? []) {
        const pid = row.product_id as string;
        if (!imagesByProduct.has(pid)) {
          imagesByProduct.set(
            pid,
            publicStorageUrl("product-images", row.storage_path as string),
          );
        }
      }
    }

    const featured: FeaturedProduct[] = rawProducts.map((p) => {
      const cat = catMap.get(p.category_id);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        available_stock: Number(p.available_stock),
        category_slug: cat?.slug ?? "",
        category_name: cat?.name ?? "",
        image_url: imagesByProduct.get(p.id) ?? null,
      };
    });

    return {
      banners,
      tickers,
      announcement,
      featured,
    };
  } catch {
    return empty;
  }
}

/** Una sola lectura por request (layout + página). */
export const getLandingPageDataCached = cache(getLandingPageData);
