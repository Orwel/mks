"use client";

import Link from "next/link";
import { useState } from "react";

import { updateOrderStatusForm } from "@/app/(dashboard)/pedidos/actions";

import { DashboardModal } from "./dashboard-modal";
import {
  DASHBOARD_BTN_GHOST,
  DASHBOARD_BTN_PRIMARY,
  DASHBOARD_FIELD,
  DASHBOARD_TABLE,
  DASHBOARD_TABLE_HEAD,
  DASHBOARD_TABLE_WRAP,
} from "./dashboard-styles";

export type OrderAdminRow = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  customer_name: string;
  created_at: string;
};

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

export function OrdersAdmin({ orders }: { orders: OrderAdminRow[] }) {
  const [selected, setSelected] = useState<OrderAdminRow | null>(null);

  const close = () => setSelected(null);

  return (
    <>
      {orders.length === 0 ? (
        <p className="rounded-xl border-4 border-dashed border-[var(--mks-ink)] bg-white p-6 text-sm text-neutral-600">
          Aún no hay pedidos en la base. Cuando existan filas en{" "}
          <code className="font-mono text-xs">orders</code>, aparecerán aquí con enlace al detalle.
        </p>
      ) : (
        <div className={DASHBOARD_TABLE_WRAP}>
          <table className={DASHBOARD_TABLE}>
            <thead className={DASHBOARD_TABLE_HEAD}>
              <tr>
                <th className="p-3">Número</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Total</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-neutral-200">
                  <td className="p-3 font-mono text-xs">{o.order_number}</td>
                  <td className="p-3 font-medium">{o.customer_name}</td>
                  <td className="p-3 text-xs font-bold uppercase">{o.status}</td>
                  <td className="p-3">
                    {o.total} {o.currency}
                  </td>
                  <td className="p-3 text-xs text-neutral-600">
                    {new Date(o.created_at).toLocaleString("es-CO")}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/pedidos/${o.id}`}
                        className={DASHBOARD_BTN_GHOST}
                      >
                        Detalle
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelected(o)}
                        className={DASHBOARD_BTN_PRIMARY}
                      >
                        Cambiar estado
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DashboardModal
        open={!!selected}
        onClose={close}
        title={selected ? `Estado — ${selected.order_number}` : "Cambiar estado"}
      >
        {selected ? (
          <form action={updateOrderStatusForm} className="space-y-4">
            <input type="hidden" name="order_id" value={selected.id} />
            <p className="text-sm text-neutral-600">
              Cliente: <strong>{selected.customer_name}</strong> · Estado actual:{" "}
              <strong className="uppercase">{selected.status}</strong>
            </p>
            <label className="block text-xs font-bold text-neutral-600">
              Nuevo estado
              <select name="status" required defaultValue={selected.status} className={DASHBOARD_FIELD}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-neutral-600">
              Nota (opcional)
              <input name="reason" className={DASHBOARD_FIELD} />
            </label>
            <div className="flex gap-2">
              <button type="submit" className={DASHBOARD_BTN_PRIMARY}>
                Actualizar
              </button>
              <button type="button" onClick={close} className={DASHBOARD_BTN_GHOST}>
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </DashboardModal>
    </>
  );
}
