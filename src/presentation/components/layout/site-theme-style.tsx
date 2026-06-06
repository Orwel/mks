import type { SiteSettings } from "@/infrastructure/supabase/queries/site-settings";
import { siteSettingsCssVars } from "@/infrastructure/supabase/queries/site-settings";

export function SiteThemeStyle({ settings }: { settings: SiteSettings }) {
  const vars = siteSettingsCssVars(settings);
  const entries = Object.entries(vars);
  // #region agent log
  fetch("http://127.0.0.1:7801/ingest/7171c2d7-123f-4eec-957b-9607ec2a1858", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1e5e6c" },
    body: JSON.stringify({
      sessionId: "1e5e6c",
      location: "site-theme-style.tsx:SiteThemeStyle",
      message: "css vars applied",
      data: { vars, entryCount: entries.length },
      timestamp: Date.now(),
      hypothesisId: "D",
    }),
  }).catch(() => {});
  // #endregion
  if (entries.length === 0) return null;

  const css = entries.map(([k, v]) => `${k}: ${v};`).join("\n  ");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {\n  ${css}\n}`,
      }}
    />
  );
}
