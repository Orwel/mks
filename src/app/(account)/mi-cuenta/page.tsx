import { requireAuth } from "@/infrastructure/supabase/auth-session";
import {
  getFeaturedActiveOrder,
  listAccountOrders,
} from "@/infrastructure/supabase/queries/account-orders";
import { AccountNotice } from "@/presentation/components/account/account-notice";
import { AccountCartSummary } from "@/presentation/components/account/account-cart-summary";
import { AccountFeaturedOrder } from "@/presentation/components/account/account-featured-order";
import { AccountOrdersPreview } from "@/presentation/components/account/account-orders-preview";
import { isAdminRole } from "@/core/value-objects/user-role";

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

  const [recentOrders, featuredOrder] = await Promise.all([
    listAccountOrders(user.id, { limit: 5 }),
    getFeaturedActiveOrder(user.id),
  ]);

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

      <AccountCartSummary />

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
            {isAdminRole(profile.role) ? (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Rol</dt>
                <dd className="mt-1 inline-block rounded-lg border-2 border-[var(--mks-ink)] bg-[var(--mks-pink)]/15 px-2 py-0.5 font-black capitalize text-[var(--mks-ink)]">
                  {profile.role}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <AccountFeaturedOrder order={featuredOrder} />
      </div>

      <AccountOrdersPreview orders={recentOrders} />

      <div className="rounded-2xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-white/60 p-6">
        <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Próximamente</h2>
        <p className="mt-3 text-sm font-medium text-neutral-600">
          Direcciones guardadas, wishlist y preferencias de notificación llegarán en siguientes
          sprints.
        </p>
      </div>
    </div>
  );
}
