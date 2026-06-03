import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

import { updateOrderStatusForm } from "../actions";

const STATUSES = [
  "cart",
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type PageProps = { params: Promise<{ orderId: string }> };

export default async function DashboardPedidoDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, subtotal, shipping, discount, total, currency, customer_name, customer_email, customer_phone, notes, created_at",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (oErr || !order) {
    notFound();
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, unit_price, quantity, subtotal")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const { data: history } = await supabase
    .from("order_status_history")
    .select("from_status, to_status, reason, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/pedidos" className="text-xs font-black uppercase text-[var(--mks-pink)] hover:underline">
          ← Pedidos
        </Link>
        <DashboardPageHeader
          title={`Pedido ${order.order_number}`}
          description={`Estado actual: ${order.status}. Cliente: ${order.customer_name}`}
        />
      </div>

      <section className="rounded-xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[6px_6px_0_0_var(--mks-ink)]">
        <h2 className="font-heading text-sm font-black text-[var(--mks-ink)]">Transición de estado</h2>
        <form action={updateOrderStatusForm} className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <input type="hidden" name="order_id" value={order.id} />
          <label className="text-xs font-bold text-neutral-600">
            Nuevo estado
            <select name="status" required defaultValue={order.status} className="mt-1 block rounded-lg border-2 border-[var(--mks-ink)] bg-white px-2 py-1.5 text-sm md:w-48">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-neutral-600 md:flex-1">
            Nota (opcional)
            <input name="reason" className="mt-1 w-full rounded-lg border-2 border-[var(--mks-ink)] bg-white px-2 py-1.5 text-sm" />
          </label>
          <button
            type="submit"
            className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-4 py-2 text-sm font-black text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]"
          >
            Guardar estado
          </button>
        </form>
      </section>

      <section className="rounded-xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[6px_6px_0_0_var(--mks-ink)]">
        <h2 className="font-heading text-sm font-black text-[var(--mks-ink)]">Datos del cliente</h2>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase text-neutral-500">Email</dt>
            <dd>{order.customer_email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-neutral-500">Teléfono</dt>
            <dd>{order.customer_phone ?? "—"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-xs font-bold uppercase text-neutral-500">Notas</dt>
            <dd>{order.notes ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-neutral-600">
          Subtotal {order.subtotal} · envío {order.shipping} · dto {order.discount} ·{" "}
          <span className="font-black text-[var(--mks-ink)]">
            total {order.total} {order.currency}
          </span>
        </p>
      </section>

      <section className="overflow-x-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white shadow-[6px_6px_0_0_var(--mks-ink)]">
        <h2 className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] p-3 font-heading text-sm font-black text-[var(--mks-ink)]">
          Ítems
        </h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-neutral-200 font-bold uppercase text-xs text-neutral-600">
            <tr>
              <th className="p-3">Producto</th>
              <th className="p-3">P. unit</th>
              <th className="p-3">Cant.</th>
              <th className="p-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it) => (
              <tr key={it.id} className="border-b border-neutral-100">
                <td className="p-3">{it.product_name}</td>
                <td className="p-3">{it.unit_price}</td>
                <td className="p-3">{it.quantity}</td>
                <td className="p-3">{it.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[6px_6px_0_0_var(--mks-ink)]">
        <h2 className="font-heading text-sm font-black text-[var(--mks-ink)]">Historial de estados</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(history ?? []).length === 0 ? (
            <li className="text-neutral-500">Sin movimientos registrados.</li>
          ) : (
            (history ?? []).map((h, i) => (
              <li key={`${h.created_at}-${i}`} className="border-l-4 border-[var(--mks-cyan)] pl-3">
                <span className="font-bold">
                  {h.from_status ?? "—"} → {h.to_status}
                </span>
                <span className="ml-2 text-xs text-neutral-500">
                  {new Date(h.created_at).toLocaleString("es-CO")}
                </span>
                {h.reason ? <p className="text-xs text-neutral-600">{h.reason}</p> : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
