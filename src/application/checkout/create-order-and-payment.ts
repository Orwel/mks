import { headers } from "next/headers";

import { createMercadoPagoPreference } from "@/application/checkout/mercadopago-checkout";
import { createStripeCheckoutSession } from "@/application/checkout/stripe-checkout";
import { isMercadoPagoConfigured } from "@/infrastructure/payments/mercadopago-client";
import { isStripeConfigured } from "@/infrastructure/payments/stripe-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  getCurrencyRatesMapCached,
  getMarketByCode,
} from "@/infrastructure/supabase/queries/markets";
import { getMarketCodeFromCookies } from "@/infrastructure/supabase/queries/markets";
import { currencyMetaFromRow } from "@/shared/lib/money/currency-meta";
import { convertAmount, roundForCurrency } from "@/shared/lib/money/convert-amount";

export type CheckoutLineInput = {
  productId: string;
  quantity: number;
};

export type CreateCheckoutResult =
  | { ok: true; redirectUrl: string; orderNumber: string }
  | { ok: false; error: string };

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MKS-${ts}-${rnd}`;
}

export async function createOrderAndPayment(input: {
  lines: CheckoutLineInput[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  acceptLegal: boolean;
}): Promise<CreateCheckoutResult> {
  if (!input.acceptLegal) {
    return { ok: false, error: "Debes aceptar términos y privacidad." };
  }
  if (input.lines.length === 0) {
    return { ok: false, error: "El carrito está vacío." };
  }

  const marketCode = await getMarketCodeFromCookies();
  if (!marketCode) {
    return { ok: false, error: "Selecciona tu mercado antes de pagar." };
  }

  const market = await getMarketByCode(marketCode);
  if (!market) {
    return { ok: false, error: "Mercado no válido." };
  }

  const provider = market.default_payment_provider;
  if (provider === "stripe" && !isStripeConfigured()) {
    return { ok: false, error: "Stripe no está configurado en el servidor." };
  }
  if (provider === "mercadopago" && !isMercadoPagoConfigured()) {
    return { ok: false, error: "Mercado Pago no está configurado en el servidor." };
  }

  const supabase = await createSupabaseServerClient();
  const rates = await getCurrencyRatesMapCached();
  const orderCurrency = market.default_currency.trim();
  const rateSnapshot = rates[orderCurrency];
  if (!rateSnapshot || rateSnapshot <= 0) {
    return { ok: false, error: "No hay tasa de cambio para la moneda del mercado." };
  }

  const { data: currencyRow } = await supabase
    .from("currencies")
    .select("code, decimal_places, zero_decimal")
    .eq("code", orderCurrency)
    .maybeSingle();
  if (!currencyRow) {
    return { ok: false, error: "Moneda del mercado no encontrada." };
  }
  const currencyMeta = currencyMetaFromRow({
    code: String(currencyRow.code),
    decimal_places: Number(currencyRow.decimal_places),
    zero_decimal: Boolean(currencyRow.zero_decimal),
  });

  const productIds = input.lines.map((l) => l.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, currency, is_active")
    .in("id", productIds)
    .eq("is_active", true);

  if (!products?.length) {
    return { ok: false, error: "Productos no disponibles." };
  }

  const productMap = new Map(products.map((p) => [p.id as string, p]));
  let subtotal = 0;
  const orderItems: {
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    currency: string;
    unit_price_cop_snapshot: number;
  }[] = [];

  for (const line of input.lines) {
    const p = productMap.get(line.productId);
    if (!p) return { ok: false, error: "Un producto del carrito ya no está disponible." };
    const qty = Math.floor(line.quantity);
    if (qty < 1) return { ok: false, error: "Cantidad no válida." };

    const productCurrency = String(p.currency).trim();
    const unitInOrder = convertAmount(Number(p.price), productCurrency, orderCurrency, rates);
    if (unitInOrder === null) {
      return { ok: false, error: `Falta tasa de cambio para ${productCurrency}.` };
    }
    const unitRounded = roundForCurrency(unitInOrder, currencyMeta);
    subtotal += unitRounded * qty;

    const copUnit = convertAmount(unitRounded, orderCurrency, "COP", rates) ?? Number(p.price);

    orderItems.push({
      product_id: line.productId,
      product_name: String(p.name),
      unit_price: unitRounded,
      quantity: qty,
      currency: orderCurrency,
      unit_price_cop_snapshot: copUnit,
    });
  }

  const total = roundForCurrency(subtotal, currencyMeta);

  const [{ data: termsDoc }, { data: privacyDoc }] = await Promise.all([
    supabase.from("legal_documents").select("id").eq("type", "terms").eq("is_current", true).maybeSingle(),
    supabase
      .from("legal_documents")
      .select("id")
      .eq("type", "privacy")
      .eq("is_current", true)
      .maybeSingle(),
  ]);

  if (!termsDoc?.id || !privacyDoc?.id) {
    return { ok: false, error: "Documentos legales no publicados." };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = hdrs.get("user-agent");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: acceptance, error: legalErr } = await supabase
    .from("legal_acceptances")
    .insert({
      user_id: user?.id ?? null,
      email: input.customerEmail.trim(),
      terms_document_id: termsDoc.id,
      privacy_document_id: privacyDoc.id,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (legalErr || !acceptance?.id) {
    return { ok: false, error: legalErr?.message ?? "No se pudo registrar aceptación legal." };
  }

  const orderNumber = generateOrderNumber();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user?.id ?? null,
      status: "pending_payment",
      subtotal: total,
      shipping: 0,
      discount: 0,
      total,
      currency: orderCurrency,
      rate_to_cop_snapshot: rateSnapshot,
      market_code: marketCode,
      payment_provider: provider,
      payment_status: "pending",
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail.trim(),
      customer_phone: input.customerPhone?.trim() || null,
      legal_acceptance_id: acceptance.id,
    })
    .select("id")
    .single();

  if (orderErr || !order?.id) {
    return { ok: false, error: orderErr?.message ?? "No se pudo crear el pedido." };
  }

  const orderId = order.id as string;

  const { error: itemsErr } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      currency: item.currency,
      unit_price_cop_snapshot: item.unit_price_cop_snapshot,
    })),
  );

  if (itemsErr) {
    return { ok: false, error: itemsErr.message };
  }

  try {
    if (provider === "stripe") {
      const { url, sessionId } = await createStripeCheckoutSession({
        orderId,
        orderNumber,
        currency: orderCurrency,
        total,
        currencyMeta,
        customerEmail: input.customerEmail.trim(),
        lineDescriptions: orderItems.map((item) => ({
          name: item.product_name,
          quantity: item.quantity,
          unitAmount: item.unit_price,
        })),
      });

      await supabase
        .from("orders")
        .update({ stripe_checkout_session_id: sessionId, payment_external_id: sessionId })
        .eq("id", orderId);

      return { ok: true, redirectUrl: url, orderNumber };
    }

    const { initPoint, preferenceId } = await createMercadoPagoPreference({
      orderId,
      orderNumber,
      currency: orderCurrency,
      customerEmail: input.customerEmail.trim(),
      customerName: input.customerName.trim(),
      items: orderItems.map((item) => ({
        title: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
    });

    await supabase
      .from("orders")
      .update({ payment_external_id: preferenceId, stripe_checkout_session_id: null })
      .eq("id", orderId);

    return { ok: true, redirectUrl: initPoint, orderNumber };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al iniciar el pago.";
    return { ok: false, error: message };
  }
}
