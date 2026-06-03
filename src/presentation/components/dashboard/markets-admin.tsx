"use client";

import { useState } from "react";

import {
  createMarket,
  deleteMarketForm,
  updateMarket,
} from "@/app/(dashboard)/mercados/actions";
import type { CurrencyRow, MarketRow } from "@/infrastructure/supabase/queries/markets";

import { DashboardModal } from "./dashboard-modal";
import {
  DASHBOARD_BTN_DANGER,
  DASHBOARD_BTN_GHOST,
  DASHBOARD_BTN_PRIMARY,
  DASHBOARD_FIELD,
  DASHBOARD_TABLE,
  DASHBOARD_TABLE_HEAD,
  DASHBOARD_TABLE_WRAP,
} from "./dashboard-styles";

export type MarketAdminRow = MarketRow;

type Modal = "create" | "edit" | "delete" | null;

function paymentCurrencies(provider: string, currencies: CurrencyRow[]) {
  return currencies.filter((c) =>
    provider === "stripe" ? c.stripe_presentment : c.mercadopago_supported,
  );
}

function MarketFormFields({
  market,
  currencies,
}: {
  market?: MarketAdminRow;
  currencies: CurrencyRow[];
}) {
  const [provider, setProvider] = useState<"stripe" | "mercadopago">(
    market?.default_payment_provider ?? "stripe",
  );
  const options = paymentCurrencies(provider, currencies);

  return (
    <>
      {!market ? (
        <label className="text-xs font-black uppercase text-neutral-600">
          Código (CO, INT, US…)
          <input name="code" required className={DASHBOARD_FIELD} placeholder="CO" />
        </label>
      ) : null}
      <label className="text-xs font-black uppercase text-neutral-600">
        Nombre
        <input name="name" required defaultValue={market?.name} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Pasarela
        <select
          name="default_payment_provider"
          className={DASHBOARD_FIELD}
          defaultValue={market?.default_payment_provider ?? "stripe"}
          onChange={(e) => setProvider(e.target.value as "stripe" | "mercadopago")}
        >
          <option value="stripe">Stripe</option>
          <option value="mercadopago">Mercado Pago</option>
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Moneda de cobro
        <select
          name="default_currency"
          className={DASHBOARD_FIELD}
          defaultValue={market?.default_currency ?? options[0]?.code}
          required
        >
          {options.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Locale
        <input
          name="default_locale"
          defaultValue={market?.default_locale ?? "es-CO"}
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Emoji bandera
        <input name="flag_emoji" defaultValue={market?.flag_emoji ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Orden
        <input
          name="sort_order"
          type="number"
          defaultValue={market?.sort_order ?? 0}
          className={DASHBOARD_FIELD}
        />
      </label>
      <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600 md:col-span-2">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={market?.is_active ?? true}
          className="size-4 border-2 border-[var(--mks-ink)]"
        />
        Activo en tienda
      </label>
    </>
  );
}

export function MarketsAdmin({
  markets,
  currencies,
}: {
  markets: MarketAdminRow[];
  currencies: CurrencyRow[];
}) {
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<MarketAdminRow | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={DASHBOARD_BTN_PRIMARY} onClick={() => setModal("create")}>
          Nuevo mercado
        </button>
      </div>

      <div className={DASHBOARD_TABLE_WRAP}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="p-3">Mercado</th>
              <th className="p-3">Moneda</th>
              <th className="p-3">Pasarela</th>
              <th className="p-3">Activo</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr key={m.code} className="border-t border-neutral-200">
                <td className="p-3 font-bold">
                  {m.flag_emoji ? `${m.flag_emoji} ` : ""}
                  {m.name} ({m.code})
                </td>
                <td className="p-3">{m.default_currency}</td>
                <td className="p-3">{m.default_payment_provider}</td>
                <td className="p-3">{m.is_active ? "Sí" : "No"}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    className={DASHBOARD_BTN_GHOST}
                    onClick={() => {
                      setSelected(m);
                      setModal("edit");
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DashboardModal open={modal === "create"} title="Nuevo mercado" onClose={() => setModal(null)}>
        <form
          action={async (fd) => {
            await createMarket(fd);
            setModal(null);
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <MarketFormFields currencies={currencies} />
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className={DASHBOARD_BTN_PRIMARY}>
              Crear
            </button>
            <button type="button" className={DASHBOARD_BTN_GHOST} onClick={() => setModal(null)}>
              Cancelar
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={modal === "edit" && !!selected}
        title={`Editar ${selected?.name}`}
        onClose={() => setModal(null)}
      >
        {selected ? (
          <form
            action={async (fd) => {
              await updateMarket(selected.code, fd);
              setModal(null);
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <MarketFormFields market={selected} currencies={currencies} />
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button type="submit" className={DASHBOARD_BTN_PRIMARY}>
                Guardar
              </button>
              <button
                type="button"
                className={DASHBOARD_BTN_DANGER}
                onClick={() => {
                  setModal("delete");
                }}
              >
                Eliminar
              </button>
              <button type="button" className={DASHBOARD_BTN_GHOST} onClick={() => setModal(null)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </DashboardModal>

      <DashboardModal open={modal === "delete"} title="Eliminar mercado" onClose={() => setModal(null)}>
        <form action={deleteMarketForm} className="space-y-4">
          <input type="hidden" name="code" value={selected?.code ?? ""} />
          <p className="text-sm">¿Eliminar {selected?.name}? Los contenidos quedarán sin mercado.</p>
          <button type="submit" className={DASHBOARD_BTN_DANGER}>
            Confirmar
          </button>
        </form>
      </DashboardModal>
    </>
  );
}
