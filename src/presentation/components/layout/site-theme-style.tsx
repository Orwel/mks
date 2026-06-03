import type { SiteSettings } from "@/infrastructure/supabase/queries/site-settings";
import { siteSettingsCssVars } from "@/infrastructure/supabase/queries/site-settings";

export function SiteThemeStyle({ settings }: { settings: SiteSettings }) {
  const vars = siteSettingsCssVars(settings);
  const entries = Object.entries(vars);
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
