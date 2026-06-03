"use client";

import { useActionState } from "react";

import { updateSiteSettings } from "@/app/(dashboard)/apariencia/actions";
import type { SiteSettings } from "@/infrastructure/supabase/queries/site-settings";
import {
  DASHBOARD_BTN_PRIMARY,
  DASHBOARD_FIELD,
} from "@/presentation/components/dashboard/dashboard-styles";

type Props = { settings: SiteSettings };

export function AppearanceAdmin({ settings }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; message: string } | null, formData: FormData) =>
      updateSiteSettings(formData),
    null,
  );

  const c = settings.brand_colors;
  const h = settings.hero;
  const f = settings.footer;
  const b = settings.buttons;
  const s = settings.sections;

  return (
    <form action={formAction} className="mx-auto max-w-3xl space-y-8">
      {state?.message ? (
        <p
          className={`text-sm font-bold ${state.ok ? "text-green-700" : "text-[var(--mks-pink)]"}`}
        >
          {state.message}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide">Colores de marca</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["color_pink", "Rosa", c.pink],
              ["color_cyan", "Cyan", c.cyan],
              ["color_ink", "Tinta", c.ink],
              ["color_cream", "Crema", c.cream],
            ] as const
          ).map(([name, label, val]) => (
            <label key={name} className="text-xs font-black uppercase text-neutral-600">
              {label}
              <input name={name} type="color" defaultValue={val ?? "#000000"} className="mt-1 h-10 w-full" />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide">Hero</h2>
        <div className="grid gap-3">
          {(
            [
              ["hero_badge", "Badge", h.badge],
              ["hero_title", "Título", h.title],
              ["hero_subtitle", "Subtítulo", h.subtitle],
              ["hero_cta_catalog", "CTA catálogo", h.cta_catalog],
              ["hero_cta_login", "CTA ingresar", h.cta_login],
            ] as const
          ).map(([name, label, val]) => (
            <label key={name} className="text-xs font-black uppercase text-neutral-600">
              {label}
              <input name={name} defaultValue={val ?? ""} className={DASHBOARD_FIELD} />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide">Footer</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["footer_tagline", "Tagline", f.tagline],
              ["footer_copyright", "Copyright", f.copyright],
              ["footer_terms_label", "Label términos", f.terms_label],
              ["footer_privacy_label", "Label privacidad", f.privacy_label],
            ] as const
          ).map(([name, label, val]) => (
            <label key={name} className="text-xs font-black uppercase text-neutral-600">
              {label}
              <input name={name} defaultValue={val ?? ""} className={DASHBOARD_FIELD} />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide">Botones</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["btn_add_to_cart", "Añadir al carrito", b.add_to_cart],
              ["btn_view_detail", "Ver detalle", b.view_detail],
              ["btn_view_catalog", "Ver catálogo", b.view_catalog],
              ["btn_apply_filters", "Aplicar filtros", b.apply_filters],
              ["btn_clear_filters", "Limpiar filtros", b.clear_filters],
            ] as const
          ).map(([name, label, val]) => (
            <label key={name} className="text-xs font-black uppercase text-neutral-600">
              {label}
              <input name={name} defaultValue={val ?? ""} className={DASHBOARD_FIELD} />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wide">Secciones</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["section_featured_bg", "Fondo destacados", s.featured_bg],
              ["section_categories_bg", "Fondo categorías", s.categories_bg],
              ["section_catalog_title", "Título catálogo", s.catalog_title],
            ] as const
          ).map(([name, label, val]) => (
            <label key={name} className="text-xs font-black uppercase text-neutral-600">
              {label}
              <input name={name} defaultValue={val ?? ""} className={DASHBOARD_FIELD} />
            </label>
          ))}
        </div>
      </section>

      <button type="submit" disabled={pending} className={DASHBOARD_BTN_PRIMARY}>
        {pending ? "Guardando…" : "Guardar apariencia"}
      </button>
    </form>
  );
}
