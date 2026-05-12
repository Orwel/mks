import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/infrastructure/supabase/auth-session";
import { cn } from "@/lib/utils";

export default async function DashboardHomePage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-cyan)]">
          Panel MKS
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
          Hola, {session.profile.full_name?.trim() || "equipo"}
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Rol:{" "}
          <span className="font-black text-[var(--mks-pink)]">{session.profile.role}</span> · Gestiona
          catálogo, pedidos y contenido del landing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/productos", title: "Productos", desc: "CRUD e imágenes" },
          { href: "/pedidos", title: "Pedidos", desc: "Estados y envíos" },
          { href: "/banners", title: "Banners", desc: "Hero y galería" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto min-h-[120px] flex-col items-start justify-between rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-5 text-left font-black shadow-[6px_6px_0_0_var(--mks-cyan)] transition hover:-translate-y-0.5",
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
