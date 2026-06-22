"use client";



import Link from "next/link";

import { useSearchParams } from "next/navigation";

import { useEffect, useMemo, useState } from "react";



import { startCheckout } from "@/app/(public)/checkout/actions";

import { initMercadoPagoCheckout } from "@/presentation/lib/mercadopago-browser";

import { formatMoney } from "@/shared/lib/format-money";

import { useCartStore } from "@/presentation/stores/cart-store";

import { mksButtonClass } from "@/presentation/components/ui/mks-button";



type Props = {

  marketLabel: string | null;

  orderCurrency: string | null;

  marketLocale: string;

};



const inputClass =

  "mt-1 w-full rounded-lg border-4 border-[var(--mks-ink)] px-3 py-2.5 text-base font-medium text-[var(--mks-ink)]";



const textareaClass =

  "mt-1 w-full min-h-[88px] resize-y rounded-lg border-4 border-[var(--mks-ink)] px-3 py-2.5 text-base font-medium text-[var(--mks-ink)]";



export function CheckoutForm({ marketLabel, orderCurrency, marketLocale }: Props) {

  const searchParams = useSearchParams();

  const cancelled = searchParams.get("cancelled") === "1";

  const lines = useCartStore((s) => s.lines);

  const [hydrated, setHydrated] = useState(() => useCartStore.persist.hasHydrated());

  const [pending, setPending] = useState(false);

  const [error, setError] = useState<string | null>(cancelled ? "Pago cancelado. Puedes intentar de nuevo." : null);



  useEffect(() => {

    if (hydrated) return undefined;

    return useCartStore.persist.onFinishHydration(() => setHydrated(true));

  }, [hydrated]);

  useEffect(() => {
    void initMercadoPagoCheckout(marketLocale);
  }, [marketLocale]);



  const displayCurrency = orderCurrency ?? lines[0]?.currency ?? "COP";

  const subtotal = useMemo(

    () => lines.reduce((acc, l) => acc + l.price * l.quantity, 0),

    [lines],

  );



  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {

    e.preventDefault();

    setError(null);

    setPending(true);

    const form = new FormData(e.currentTarget);

    const result = await startCheckout({

      lines: lines.map((l) => ({

        productId: l.productId,

        versionId: l.versionId,

        quantity: l.quantity,

      })),

      customerName: String(form.get("customer_name") ?? ""),

      customerEmail: String(form.get("customer_email") ?? ""),

      customerPhone: String(form.get("customer_phone") ?? "") || undefined,

      shippingAddress: {

        city: String(form.get("shipping_city") ?? ""),

        street: String(form.get("shipping_street") ?? ""),

        apartment: String(form.get("shipping_apartment") ?? "") || undefined,

        building: String(form.get("shipping_building") ?? "") || undefined,

        postal_code: String(form.get("shipping_postal_code") ?? "") || undefined,

        notes: String(form.get("shipping_notes") ?? "") || undefined,

      },

      acceptLegal: form.get("accept_legal") === "on",

    });

    if (!result.ok) {
      setPending(false);
      setError(result.error);
      return;
    }

    window.location.assign(result.redirectUrl);

  }



  if (!hydrated) {

    return <p className="text-sm text-neutral-600">Cargando carrito…</p>;

  }



  if (lines.length === 0) {

    return (

      <div className="space-y-4">

        <p className="text-sm font-medium text-neutral-700">No hay productos en el carrito.</p>

        <Link href="/catalogo" className={mksButtonClass({ variant: "accent", size: "md" })}>

          Ir al catálogo

        </Link>

      </div>

    );

  }



  const submitLabel = pending

    ? "Redirigiendo…"

    : `Pagar con Mercado Pago (${displayCurrency})`;



  return (

    <>

      {process.env.NODE_ENV === "development" ? (
        <div className="mb-6 rounded-xl border-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-black">Prueba Mercado Pago (sandbox) — lee esto antes de pagar</p>
          <ol className="mt-2 list-inside list-decimal space-y-2">
            <li>
              <strong>Paso 1:</strong> En incógnito, abre{" "}
              <a
                href="https://www.mercadopago.com.co/logout"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
              >
                mercadopago.com.co/logout
              </a>{" "}
              para cerrar tu cuenta real.
            </li>
            <li>
              <strong>Paso 2:</strong> Checkout aquí → te manda a sandbox. Si arriba ves tu email real (
              hotmail, etc.), cierra sesión otra vez.
            </li>
            <li>
              <strong>Paso 3:</strong> «Pagar con otro medio» → tarjeta nueva (no guardada):{" "}
              <strong>5254 1336 7440 3564</strong> · CVV 123 · 11/30 · titular <strong>APRO</strong> · doc.{" "}
              123456789.
            </li>
            <li>No inicies sesión con tu cuenta real. El código de 6 dígitos del panel solo aplica si MP pide login de comprador de prueba.</li>
          </ol>
        </div>
      ) : null}

      <form

        id="checkout-form"

        onSubmit={onSubmit}

        className="grid gap-8 pb-28 lg:grid-cols-[1fr_minmax(0,20rem)] lg:pb-0"

      >

        <div className="order-2 space-y-6 lg:order-none">

          <div className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] p-4 text-sm">

            <p>

              <span className="font-black">Pago:</span> Mercado Pago en {displayCurrency}

            </p>

          </div>



          <fieldset className="space-y-4">

            <legend className="text-xs font-black uppercase tracking-wide text-[var(--mks-ink)]">

              Datos de contacto

            </legend>

            <label className="block text-xs font-black uppercase text-neutral-600">

              Nombre completo

              <input name="customer_name" required autoComplete="name" className={inputClass} />

            </label>

            <label className="block text-xs font-black uppercase text-neutral-600">

              Email

              <input

                name="customer_email"

                type="email"

                required

                autoComplete="email"

                className={inputClass}

              />

            </label>

            <label className="block text-xs font-black uppercase text-neutral-600">

              Teléfono (opcional)

              <input name="customer_phone" type="tel" autoComplete="tel" className={inputClass} />

            </label>

          </fieldset>



          <fieldset className="space-y-4">

            <legend className="text-xs font-black uppercase tracking-wide text-[var(--mks-ink)]">

              Dirección de envío

            </legend>



            <div>

              <span className="block text-xs font-black uppercase text-neutral-600">País</span>

              <div

                className="mt-1 w-full rounded-lg border-4 border-[var(--mks-ink)] bg-neutral-100 px-3 py-2.5 text-base font-medium text-neutral-700"

                aria-readonly="true"

              >

                {marketLabel ?? "—"}

              </div>

              <p className="mt-1 text-xs text-neutral-500">

                Para cambiar el país, usa el selector de mercado en el menú superior.

              </p>

            </div>



            <label className="block text-xs font-black uppercase text-neutral-600">

              Ciudad

              <input

                name="shipping_city"

                required

                autoComplete="address-level2"

                className={inputClass}

                placeholder="Ej. Bogotá"

              />

            </label>



            <label className="block text-xs font-black uppercase text-neutral-600">

              Dirección

              <input

                name="shipping_street"

                required

                autoComplete="street-address"

                className={inputClass}

                placeholder="Calle, carrera, número"

              />

            </label>



            <div className="grid gap-4 sm:grid-cols-2">

              <label className="block text-xs font-black uppercase text-neutral-600">

                Apartamento (opcional)

                <input

                  name="shipping_apartment"

                  autoComplete="address-line2"

                  className={inputClass}

                  placeholder="Ej. 402"

                />

              </label>

              <label className="block text-xs font-black uppercase text-neutral-600">

                Torre / edificio (opcional)

                <input name="shipping_building" className={inputClass} placeholder="Ej. Torre B" />

              </label>

            </div>



            <label className="block text-xs font-black uppercase text-neutral-600">

              Código postal (opcional)

              <input

                name="shipping_postal_code"

                autoComplete="postal-code"

                className={inputClass}

                placeholder="Ej. 110111"

              />

            </label>



            <label className="block text-xs font-black uppercase text-neutral-600">

              Anotaciones (opcional)

              <textarea

                name="shipping_notes"

                className={textareaClass}

                placeholder="Referencias, horario de entrega u otra información relevante"

                maxLength={500}

              />

            </label>

          </fieldset>



          <label className="flex items-start gap-2 text-sm font-medium">

            <input name="accept_legal" type="checkbox" required className="mt-1 size-4" />

            <span>

              Acepto los{" "}

              <Link href="/terminos" className="font-bold text-[var(--mks-pink)] underline" target="_blank">

                términos

              </Link>{" "}

              y la{" "}

              <Link href="/privacidad" className="font-bold text-[var(--mks-pink)] underline" target="_blank">

                privacidad

              </Link>

              .

            </span>

          </label>



          {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error}</p> : null}



          <button

            type="submit"

            disabled={pending || !orderCurrency}

            className={mksButtonClass({

              variant: "primary",

              size: "md",

              className: "hidden w-full lg:inline-flex",

            })}

          >

            {submitLabel}

          </button>

        </div>



        <aside className="order-1 rounded-xl border-4 border-[var(--mks-ink)] bg-white p-4 lg:order-none">

          <h2 className="text-xs font-black uppercase tracking-wide text-neutral-500">Resumen</h2>

          <ul className="mt-3 space-y-2 text-sm">

            {lines.map((l) => (

              <li key={l.versionId} className="flex justify-between gap-2">

                <span className="min-w-0">

                  {l.name} × {l.quantity}

                </span>

                <span className="shrink-0 font-medium">

                  {formatMoney(l.price * l.quantity, l.currency, marketLocale)}

                </span>

              </li>

            ))}

          </ul>

          <p className="mt-4 flex justify-between border-t-2 border-neutral-200 pt-3 font-black">

            <span>Total</span>

            <span>{formatMoney(subtotal, displayCurrency, marketLocale)}</span>

          </p>

          <p className="mt-2 text-xs text-neutral-500">

            El cargo en Mercado Pago será en {displayCurrency}, según tu mercado seleccionado.

          </p>

        </aside>

      </form>



      <div className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]/95 p-4 pb-safe backdrop-blur-md lg:hidden">

        <div className="mx-auto flex max-w-4xl items-center gap-3">

          <p className="shrink-0 text-sm font-black text-[var(--mks-ink)]">

            {formatMoney(subtotal, displayCurrency, marketLocale)}

          </p>

          <button

            type="submit"

            form="checkout-form"

            disabled={pending || !orderCurrency}

            className={mksButtonClass({

              variant: "primary",

              size: "md",

              className: "min-w-0 flex-1",

            })}

          >

            {pending ? "…" : "Pagar"}

          </button>

        </div>

      </div>

    </>

  );

}

