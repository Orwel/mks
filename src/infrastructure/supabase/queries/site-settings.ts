import { cache } from "react";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export type SiteBrandColors = {
  pink?: string;
  cyan?: string;
  ink?: string;
  cream?: string;
};

export type SiteHeroSettings = {
  badge?: string;
  title?: string;
  subtitle?: string;
  cta_catalog?: string;
  cta_login?: string;
  bg_from?: string;
  bg_via?: string;
  bg_to?: string;
};

export type SiteFooterSettings = {
  tagline?: string;
  copyright?: string;
  terms_label?: string;
  privacy_label?: string;
};

export type SiteButtonSettings = {
  add_to_cart?: string;
  view_detail?: string;
  view_catalog?: string;
  apply_filters?: string;
  clear_filters?: string;
};

export type SiteSectionSettings = {
  featured_bg?: string;
  categories_bg?: string;
  catalog_title?: string;
};

export type SiteSettings = {
  brand_colors: SiteBrandColors;
  hero: SiteHeroSettings;
  footer: SiteFooterSettings;
  buttons: SiteButtonSettings;
  sections: SiteSectionSettings;
};

const EMPTY: SiteSettings = {
  brand_colors: {},
  hero: {},
  footer: {},
  buttons: {},
  sections: {},
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("site_settings")
      .select("brand_colors, hero, footer, buttons, sections")
      .eq("id", 1)
      .maybeSingle();
    if (!data) {
      // #region agent log
      fetch("http://127.0.0.1:7801/ingest/7171c2d7-123f-4eec-957b-9607ec2a1858", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1e5e6c" },
        body: JSON.stringify({
          sessionId: "1e5e6c",
          location: "site-settings.ts:getSiteSettings",
          message: "no row found",
          data: { hasData: false },
          timestamp: Date.now(),
          hypothesisId: "E",
        }),
      }).catch(() => {});
      // #endregion
      return EMPTY;
    }
    const result = {
      brand_colors: (data.brand_colors as SiteBrandColors) ?? {},
      hero: (data.hero as SiteHeroSettings) ?? {},
      footer: (data.footer as SiteFooterSettings) ?? {},
      buttons: (data.buttons as SiteButtonSettings) ?? {},
      sections: (data.sections as SiteSectionSettings) ?? {},
    };
    // #region agent log
    fetch("http://127.0.0.1:7801/ingest/7171c2d7-123f-4eec-957b-9607ec2a1858", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1e5e6c" },
      body: JSON.stringify({
        sessionId: "1e5e6c",
        location: "site-settings.ts:getSiteSettings",
        message: "settings loaded",
        data: {
          heroTitle: result.hero.title ?? null,
          colorPink: result.brand_colors.pink ?? null,
          footerTagline: result.footer.tagline ?? null,
        },
        timestamp: Date.now(),
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion
    return result;
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7801/ingest/7171c2d7-123f-4eec-957b-9607ec2a1858", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1e5e6c" },
      body: JSON.stringify({
        sessionId: "1e5e6c",
        location: "site-settings.ts:getSiteSettings",
        message: "query error",
        data: { error: String(err) },
        timestamp: Date.now(),
        hypothesisId: "E",
      }),
    }).catch(() => {});
    // #endregion
    return EMPTY;
  }
}

export const getSiteSettingsCached = cache(getSiteSettings);

export function siteSettingsCssVars(settings: SiteSettings): Record<string, string> {
  const c = settings.brand_colors;
  const vars: Record<string, string> = {};
  if (c.pink) vars["--mks-pink"] = c.pink;
  if (c.cyan) vars["--mks-cyan"] = c.cyan;
  if (c.ink) vars["--mks-ink"] = c.ink;
  if (c.cream) vars["--mks-cream"] = c.cream;
  return vars;
}
