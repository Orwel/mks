import { requireAuth } from "@/infrastructure/supabase/auth-session";
import { AccountNotice } from "@/presentation/components/account/account-notice";

export default async function MiCuentaPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>;
}) {
  const session = await requireAuth();
  const params = searchParams ? await searchParams : {};
  const raw = params.error;
  const errorKey = Array.isArray(raw) ? raw[0] : raw;

  const { user, profile } = session;

  return (
    <div className="space-y-8">
      {errorKey === "no_admin" ? (
        <AccountNotice message="El panel de administración solo está disponible para cuentas con rol administrador. Si necesitas acceso, contacta al dueño de la tienda." />
      ) : null}

      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-pink)]">
          Tu espacio
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
          Mi cuenta
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[8px_8px_0_0_var(--mks-cyan)]">
          <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Perfil</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Nombre</dt>
              <dd className="mt-1 font-semibold text-[var(--mks-ink)]">{profile.full_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Correo</dt>
              <dd className="mt-1 font-semibold text-[var(--mks-ink)]">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Teléfono</dt>
              <dd className="mt-1 font-semibold text-[var(--mks-ink)]">{profile.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Rol</dt>
              <dd className="mt-1 inline-block rounded-lg border-2 border-[var(--mks-ink)] bg-[var(--mks-pink)]/15 px-2 py-0.5 font-black capitalize text-[var(--mks-ink)]">
                {profile.role}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-white/60 p-6">
          <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Próximamente</h2>
          <p className="mt-3 text-sm font-medium text-neutral-600">
            Direcciones guardadas, wishlist y preferencias de notificación llegarán en siguientes
            sprints.
          </p>
        </div>
      </div>
    </div>
  );
}
