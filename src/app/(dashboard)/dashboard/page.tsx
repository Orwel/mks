import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/infrastructure/supabase/auth-session";
import { cn } from "@/lib/utils";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

const QUICK_LINKS = [
  { href: "/mercados", title: "Mercados", desc: "Países, moneda e inventario por mercado" },
  { href: "/categorias", title: "Categorías", desc: "Árbol y visibilidad" },
  { href: "/pedidos", title: "Pedidos", desc: "Estados y seguimiento" },
  { href: "/destacados", title: "Destacados", desc: "Carrusel del hero en la portada" },
  { href: "/ticker", title: "Ticker", desc: "Mensajes rotativos" },
  { href: "/anuncios", title: "Anuncios pop-up", desc: "Modales al ingresar al sitio" },
  { href: "/legal", title: "Legal", desc: "Versiones y publicación" },
  { href: "/contacto", title: "Contáctanos", desc: "Mensajes del formulario público" },
  { href: "/usuarios", title: "Usuarios", desc: "Roles (solo admin en RLS)" },
] as const;

export default async function DashboardHomePage() {
  const session = await requireAdmin();

  return (
    <div className="space-y-10">
      <DashboardPageHeader
        title={`Hola, ${session.profile.full_name?.trim() || "administrador"}`}
        description="Gestioná catálogo, pedidos y contenido del sitio. El acceso a estas rutas queda restringido por rol en la app y en Supabase (RLS)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto min-h-[118px] flex-col items-start justify-between rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-5 text-left font-black shadow-[6px_6px_0_0_var(--mks-cyan)] transition hover:-translate-y-0.5",
            )}
          >
            <span className="text-lg text-[var(--mks-ink)]">{c.title}</span>
            <span className="text-xs font-semibold text-neutral-500">{c.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
