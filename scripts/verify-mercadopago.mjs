/**
 * Verificación automática de credenciales y preferencias Mercado Pago.
 * Uso: node scripts/verify-mercadopago.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envText = readFileSync(resolve(root, ".env.local"), "utf8");
const token = envText.match(/MP_ACCESS_TOKEN=(.+)/)?.[1]?.trim();
const testPayer = envText.match(/MP_TEST_PAYER_EMAIL=(.+)/)?.[1]?.trim();
const sandboxFlag = envText.match(/MP_SANDBOX=(.+)/)?.[1]?.trim();

const FETCH_TIMEOUT_MS = 25_000;

if (!token) {
  console.error("FAIL: MP_ACCESS_TOKEN no encontrado en .env.local");
  process.exit(1);
}

const headers = (extra = {}) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  ...extra,
});

async function req(method, url, body, extraHeaders) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      headers: headers(extraHeaders),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: true, status: res.status, data };
  } catch (e) {
    const message =
      e?.name === "AbortError"
        ? `timeout (${FETCH_TIMEOUT_MS / 1000}s)`
        : e?.cause?.code === "UND_ERR_CONNECT_TIMEOUT"
          ? "connect timeout (red/firewall/VPN)"
          : e?.message ?? String(e);
    return { ok: false, status: 0, data: {}, error: message };
  } finally {
    clearTimeout(timer);
  }
}

function pass(label) {
  console.log(`  ✅ ${label}`);
}
function fail(label, detail = "") {
  console.log(`  ❌ ${label}${detail ? `: ${detail}` : ""}`);
}
function warn(label) {
  console.log(`  ⚠️  ${label}`);
}

let coreFailed = false;

console.log("\n=== Mercado Pago — verificación automática ===\n");

// 1. Cuenta vendedor (token = cuenta Vendedor de prueba)
const me = await req("GET", "https://api.mercadopago.com/users/me");
if (me.ok && me.status === 200 && me.data.id) {
  pass(`Token válido — vendedor id=${me.data.id} site=${me.data.site_id}`);
  if (me.data.email) {
    console.log(`     email vendedor: ${me.data.email}`);
  }
} else {
  fail("Token inválido", me.error || me.data.message || String(me.status));
  process.exit(1);
}

const collectorId = String(me.data.id);
const isTestSeller = /@testuser\.com$/i.test(me.data.email ?? "");

// 2. Preferencia sandbox (como el código actual: sin payer, localhost)
const prefBody = {
  items: [{ title: "Test MKS", quantity: 1, unit_price: 45900, currency_id: "COP" }],
  external_reference: `verify-${Date.now()}`,
  back_urls: {
    success: "http://localhost:3000/pedido/TEST?status=success",
    failure: "http://localhost:3000/checkout?cancelled=1",
    pending: "http://localhost:3000/pedido/TEST?status=pending",
  },
};

const pref = await req("POST", "https://api.mercadopago.com/checkout/preferences", prefBody);
if (pref.ok && pref.status === 201 && pref.data.id) {
  const sandbox = pref.data.sandbox_init_point;
  const prod = pref.data.init_point;
  pass(`Preferencia sandbox id=${pref.data.id}`);
  if (sandbox?.includes("sandbox.mercadopago")) {
    pass(`sandbox_init_point OK (${sandbox.slice(0, 60)}…)`);
  } else {
    fail("sandbox_init_point ausente o incorrecto");
    coreFailed = true;
  }
  if (prod?.includes("www.mercadopago") && isTestSeller) {
    warn("init_point apunta a producción (normal; en la app usamos sandbox_init_point)");
  }
} else {
  fail("Crear preferencia sandbox", pref.error || pref.data.message || String(pref.status));
  coreFailed = true;
}

// 3. Preferencia producción (mykoreastore.com)
const prodBody = {
  ...prefBody,
  external_reference: `verify-prod-${Date.now()}`,
  notification_url: "https://www.mykoreastore.com/api/webhooks/mercadopago",
  back_urls: {
    success: "https://www.mykoreastore.com/pedido/TEST?status=success",
    failure: "https://www.mykoreastore.com/checkout?cancelled=1",
    pending: "https://www.mykoreastore.com/pedido/TEST?status=pending",
  },
  auto_return: "approved",
  payer: { email: "test@example.com", name: "Test", surname: "User" },
};

const prefProd = await req("POST", "https://api.mercadopago.com/checkout/preferences", prodBody);
if (prefProd.ok && prefProd.status === 201) {
  pass("Preferencia producción (mykoreastore.com + auto_return) OK");
} else {
  warn(
    `Preferencia producción: ${prefProd.error || prefProd.data.message || prefProd.status} (opcional en local)`,
  );
}

// 4. Casos que deben fallar
const zeroPref = await req("POST", "https://api.mercadopago.com/checkout/preferences", {
  items: [{ title: "Zero", quantity: 1, unit_price: 0, currency_id: "COP" }],
});
if (zeroPref.ok && zeroPref.status >= 400) {
  pass(`MP rechaza unit_price=0 (${zeroPref.data.message || zeroPref.status})`);
} else if (!zeroPref.ok) {
  warn(`unit_price=0 test omitido: ${zeroPref.error}`);
} else {
  fail("MP debería rechazar unit_price=0");
}

const excl = await req("POST", "https://api.mercadopago.com/checkout/preferences", {
  items: [{ title: "T", quantity: 1, unit_price: 1000, currency_id: "COP" }],
  payment_methods: { excluded_payment_types: [{ id: "account_money" }] },
});
if (excl.ok && excl.status >= 400 && String(excl.data.message || "").includes("account_money")) {
  pass("MP rechaza excluded account_money (esperado)");
} else if (excl.ok && excl.status === 201) {
  warn("account_money exclusion aceptada (varía por país/cuenta)");
} else if (!excl.ok) {
  warn(`account_money test omitido: ${excl.error}`);
}

// 5–6. Opcional: Payments API (Checkout Pro NO lo usa)
console.log("\n  --- Diagnóstico opcional (Payments API) ---");
const card = await req("POST", "https://api.mercadopago.com/v1/card_tokens", {
  card_number: "5254133674403564",
  expiration_month: 11,
  expiration_year: 2030,
  security_code: "123",
  cardholder: {
    name: "APRO",
    identification: { type: "CC", number: "123456789" },
  },
});
if (card.ok && card.status === 201 && card.data.id) {
  pass(`Card token creado (${card.data.id.slice(0, 12)}…)`);
  if (testPayer) {
    const pay = await req(
      "POST",
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: 45900,
        token: card.data.id,
        description: "MKS verify",
        installments: 1,
        payment_method_id: "master",
        payer: { email: testPayer },
        external_reference: `pay-verify-${Date.now()}`,
      },
      { "X-Idempotency-Key": `mks-verify-${Date.now()}` },
    );
    if (pay.ok && pay.status === 201 && pay.data.status === "approved") {
      pass(`Pago API aprobado id=${pay.data.id}`);
    } else if (!pay.ok) {
      warn(`Pago API omitido: ${pay.error} — Checkout Pro no depende de esto`);
    } else {
      warn(
        `Pago API: ${pay.status} ${pay.data.message || pay.data.status || ""} — Checkout Pro no usa Payments API directa`,
      );
    }
  }
} else if (!card.ok) {
  warn(`Card token omitido: ${card.error} — no afecta Checkout Pro`);
} else {
  warn(`Card token: ${card.data.message || card.status}`);
}

console.log("\n=== Resumen integración (Checkout Pro) ===");
if (coreFailed) {
  console.log("❌ Falló al menos una prueba crítica de preferencias.");
  process.exit(1);
}
console.log("✅ Tu backend crea preferencias sandbox correctamente.");
console.log("   El token en .env.local = cuenta VENDEDOR de prueba.");
console.log("   Para pagar en el navegador = cuenta COMPRADOR de prueba (otra fila en el panel).");
console.log("\n=== Cómo probar el pago (doc oficial MP) ===");
console.log("1. Panel → Cuentas de prueba → Comprador: Usuario + Contraseña.");
console.log("2. Si MP pide código por email al login → Código de verificación (6 dígitos) del COMPRADOR en el panel.");
console.log("   (No es tu Gmail. No es el email. Es el número de 6 dígitos de esa fila.)");
console.log("3. O paga SIN login: incógnito + logout MP + tarjeta 5254 1336 7440 3564, titular APRO.");
console.log("4. Comprador y vendedor deben ser del mismo país (Colombia).");
console.log(`\nMP_SANDBOX=${sandboxFlag ?? "(no set)"}  MP_TEST_PAYER_EMAIL=${testPayer ?? "unset"}`);
console.log(`Collector: ${collectorId}\n`);
