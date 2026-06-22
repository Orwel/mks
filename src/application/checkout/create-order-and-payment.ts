import { headers } from "next/headers";

import { createMercadoPagoPreference } from "@/application/checkout/mercadopago-checkout";
import { resolveCheckoutSiteUrl } from "@/application/checkout/site-url";
import { isMercadoPagoConfigured } from "@/infrastructure/payments/mercadopago-client";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  getCurrencyRatesMapCached,
  getMarketByCode,
  getMarketCodeFromCookies,
} from "@/infrastructure/supabase/queries/markets";
import { currencyMetaFromRow } from "@/shared/lib/money/currency-meta";
import { convertAmount, roundForCurrency } from "@/shared/lib/money/convert-amount";
import {
  buildShippingAddress,
  validateShippingAddressInput,
  type ShippingAddressInput,
} from "@/shared/types/shipping-address";

export type CheckoutLineInput = {
  productId: string;
  versionId: string;
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

function checkoutErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message.trim()) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "Error al iniciar el pago.";
}

export async function createOrderAndPayment(input: {
  lines: CheckoutLineInput[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: ShippingAddressInput;
  acceptLegal: boolean;
}): Promise<CreateCheckoutResult> {
  if (!input.acceptLegal) {
    return { ok: false, error: "Debes aceptar términos y privacidad." };
  }
  if (input.lines.length === 0) {
    return { ok: false, error: "El carrito está vacío." };
  }

  const addressValidation = validateShippingAddressInput(input.shippingAddress);
  if (!addressValidation.ok) {
    return { ok: false, error: addressValidation.error };
  }

  const marketCode = await getMarketCodeFromCookies();
  if (!marketCode) {
    return { ok: false, error: "Selecciona tu mercado antes de pagar." };
  }

  const market = await getMarketByCode(marketCode);
  if (!market) {
    return { ok: false, error: "Mercado no válido." };
  }

  const shippingAddress = buildShippingAddress(
    marketCode,
    market.name,
    addressValidation.data,
  );

  if (!isMercadoPagoConfigured()) {
    return { ok: false, error: "Mercado Pago no está configurado en el servidor." };
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
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

  const versionIds = input.lines.map((l) => l.versionId);
  const { data: versions } = await supabase
    .from("product_versions")
    .select(
      "id, name, product_id, is_active, products(id, name, is_active), product_version_market_stock(price, currency, is_active, market_code)",
    )
    .in("id", versionIds)
    .eq("is_active", true);

  if (!versions?.length) {
    return { ok: false, error: "Productos no disponibles." };
  }

  const versionMap = new Map(versions.map((v) => [v.id as string, v]));
  let subtotal = 0;
  const orderItems: {
    product_id: string;
    version_id: string;
    version_name: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    currency: string;
    unit_price_cop_snapshot: number;
  }[] = [];

  for (const line of input.lines) {
    const v = versionMap.get(line.versionId);
    if (!v) return { ok: false, error: "Un producto del carrito ya no está disponible." };

    const rawProduct = v.products as
      | { id: string; name: string; is_active: boolean }
      | { id: string; name: string; is_active: boolean }[]
      | null;
    const product = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct;
    if (!product?.is_active) {
      return { ok: false, error: "Un producto del carrito ya no está disponible." };
    }

    const stocks = (v.product_version_market_stock ?? []) as {
      price: number;
      currency: string;
      is_active: boolean;
      market_code: string;
    }[];
    const stockRow = stocks.find((s) => s.market_code === marketCode && s.is_active);
    if (!stockRow) {
      return { ok: false, error: "Precio no disponible para tu mercado." };
    }

    const qty = Math.floor(line.quantity);
    if (qty < 1) return { ok: false, error: "Cantidad no válida." };

    const unitRounded = roundForCurrency(Number(stockRow.price), currencyMeta);
    subtotal += unitRounded * qty;

    const copUnit =
      convertAmount(unitRounded, orderCurrency, "COP", rates) ?? Number(stockRow.price);

    const versionName = String(v.name);
    orderItems.push({
      product_id: product.id,
      version_id: line.versionId,
      version_name: versionName,
      product_name: `${String(product.name)}${versionName !== "Versión única" ? ` — ${versionName}` : ""}`,
      unit_price: unitRounded,
      quantity: qty,
      currency: orderCurrency,
      unit_price_cop_snapshot: copUnit,
    });
  }

  const total = roundForCurrency(subtotal, currencyMeta);

  if (total <= 0 || orderItems.some((item) => item.unit_price <= 0)) {
    return {
      ok: false,
      error:
        "El pedido tiene precio $0. Asigna un precio al producto en el panel (Mercados → productos) antes de pagar.",
    };
  }

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

  const { data: acceptance, error: legalErr } = await admin
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

  const { data: order, error: orderErr } = await admin
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
      payment_provider: "mercadopago",
      payment_status: "pending",
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail.trim(),
      customer_phone: input.customerPhone?.trim() || null,
      shipping_address: shippingAddress,
      notes: shippingAddress.notes ?? null,
      legal_acceptance_id: acceptance.id,
    })
    .select("id")
    .single();

  if (orderErr || !order?.id) {
    return { ok: false, error: orderErr?.message ?? "No se pudo crear el pedido." };
  }

  const orderId = order.id as string;

  const { error: itemsErr } = await admin.from("order_items").insert(
    orderItems.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      version_id: item.version_id,
      version_name: item.version_name,
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

  const { siteUrl } = await resolveCheckoutSiteUrl();

  try {
    const { initPoint, preferenceId } = await createMercadoPagoPreference({
      siteUrl,
      orderId,
      orderNumber,
      currency: orderCurrency,
      customerEmail: input.customerEmail.trim(),
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone?.trim(),
      shippingAddress,
      items: orderItems.map((item) => ({
        title: item.product_name,
        description: `Pedido ${orderNumber} — ${item.product_name}`.slice(0, 256),
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
    });

    await admin
      .from("orders")
      .update({ payment_external_id: preferenceId, stripe_checkout_session_id: null })
      .eq("id", orderId);

    return { ok: true, redirectUrl: initPoint, orderNumber };
  } catch (e) {
    const message = checkoutErrorMessage(e);
    return { ok: false, error: message };
  }
}
