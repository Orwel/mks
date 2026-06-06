"use client";

import Link from "next/link";
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

const PRESET_MARKETS = [
  { code: "CO", name: "Colombia", currency: "COP", locale: "es-CO", flag: "🇨🇴" },
  { code: "MX", name: "México", currency: "MXN", locale: "es-MX", flag: "🇲🇽" },
  { code: "PE", name: "Perú", currency: "PEN", locale: "es-PE", flag: "🇵🇪" },
  { code: "EC", name: "Ecuador", currency: "USD", locale: "es-EC", flag: "🇪🇨" },
] as const;

function mercadoPagoCurrencies(currencies: CurrencyRow[]) {
  return currencies.filter((c) => c.mercadopago_supported);
}

function MarketFormFields({
  market,
  currencies,
  existingCodes,
}: {
  market?: MarketAdminRow;
  currencies: CurrencyRow[];
  existingCodes: string[];
}) {
  const mpCurrencies = mercadoPagoCurrencies(currencies);
  const availablePresets = PRESET_MARKETS.filter((p) => !existingCodes.includes(p.code));
  const [preset, setPreset] = useState<string>(availablePresets[0]?.code ?? "");

  const selectedPreset = PRESET_MARKETS.find((p) => p.code === preset);

  if (!market) {
    return (
      <>
        <input type="hidden" name="default_payment_provider" value="mercadopago" />
        <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
          País / mercado
          <select
            name="preset_code"
            className={DASHBOARD_FIELD}
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            required
          >
            {availablePresets.length === 0 ? (
              <option value="">Todos los países ya están creados</option>
            ) : (
              availablePresets.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.flag} {p.name} ({p.currency})
                </option>
              ))
            )}
          </select>
        </label>
        {selectedPreset ? (
          <>
            <input type="hidden" name="code" value={selectedPreset.code} />
            <input type="hidden" name="name" value={selectedPreset.name} />
            <input type="hidden" name="default_currency" value={selectedPreset.currency} />
            <input type="hidden" name="default_locale" value={selectedPreset.locale} />
            <input type="hidden" name="flag_emoji" value={selectedPreset.flag} />
          </>
        ) : null}
        <p className="text-xs text-neutral-600 md:col-span-2">
          Pagos con Mercado Pago en la moneda del mercado. Puedes activar o desactivar la visibilidad en
          tienda.
        </p>
        <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600 md:col-span-2">
          <input name="is_active" type="checkbox" defaultChecked className="size-4 border-2 border-[var(--mks-ink)]" />
          Activo en tienda
        </label>
        <label className="text-xs font-black uppercase text-neutral-600">
          Orden
          <input name="sort_order" type="number" defaultValue={0} className={DASHBOARD_FIELD} />
        </label>
      </>
    );
  }

  return (
    <>
      <input type="hidden" name="default_payment_provider" value="mercadopago" />
      <p className="text-sm font-bold text-[var(--mks-ink)] md:col-span-2">
        {market.flag_emoji} {market.name} ({market.code}) — {market.default_currency}
      </p>
      <label className="text-xs font-black uppercase text-neutral-600">
        Nombre visible
        <input name="name" required defaultValue={market.name} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Moneda (Mercado Pago)
        <select
          name="default_currency"
          className={DASHBOARD_FIELD}
          defaultValue={market.default_currency}
          required
        >
          {mpCurrencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Locale
        <input name="default_locale" defaultValue={market.default_locale} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Emoji bandera
        <input name="flag_emoji" defaultValue={market.flag_emoji ?? ""} className={DASHBOARD_FIELD} />
      </label>
      <label className="text-xs font-black uppercase text-neutral-600">
        Orden
        <input name="sort_order" type="number" defaultValue={market.sort_order} className={DASHBOARD_FIELD} />
      </label>
      <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600 md:col-span-2">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={market.is_active}
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
  const existingCodes = markets.map((m) => m.code);
  const presetsLeft = availablePresets(existingCodes);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={DASHBOARD_BTN_PRIMARY}
          onClick={() => setModal("create")}
          disabled={presetsLeft.length === 0}
        >
          Añadir país
        </button>
      </div>
      <p className="text-xs text-neutral-600">
        Los compradores eligen mercado al entrar. Precios y Mercado Pago usan la moneda configurada.
      </p>

      <div className={DASHBOARD_TABLE_WRAP}>
        <table className={DASHBOARD_TABLE}>
          <thead className={DASHBOARD_TABLE_HEAD}>
            <tr>
              <th className="p-3">Mercado</th>
              <th className="p-3">Moneda</th>
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
                <td className="p-3">{m.is_active ? "Sí" : "No"}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/mercados/${m.code}/productos`}
                    className={DASHBOARD_BTN_GHOST}
                  >
                    Productos
                  </Link>{" "}
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

      <DashboardModal open={modal === "create"} title="Añadir país" onClose={() => setModal(null)}>
        <form
          action={async (fd) => {
            await createMarket(fd);
            setModal(null);
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <MarketFormFields currencies={currencies} existingCodes={existingCodes} />
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className={DASHBOARD_BTN_PRIMARY} disabled={presetsLeft.length === 0}>
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
            <MarketFormFields market={selected} currencies={currencies} existingCodes={existingCodes} />
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

function availablePresets(existingCodes: string[]) {
  return PRESET_MARKETS.filter((p) => !existingCodes.includes(p.code));
}
