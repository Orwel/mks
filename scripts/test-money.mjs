// Pruebas de la capa de dinero y direcciones.
// Uso:  npm run test:money
import { roundForCurrency, convertAmount, toMinorUnits } from '../.money-build/lib/money/convert-amount.js';
import { currencyMetaFromRow } from '../.money-build/lib/money/currency-meta.js';
import { validateShippingAddressInput, buildShippingAddress } from '../.money-build/types/shipping-address.js';

let pass=0, fail=0;
const eq = (n, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) {
    pass += 1;
    console.log(`  ✅ ${n}`);
  } else {
    fail += 1;
    console.log(`  ❌ ${n} — obtuvo ${JSON.stringify(got)}, esperaba ${JSON.stringify(want)}`);
  }
};
const truthy = (n, got) => {
  if (got) {
    pass += 1;
    console.log(`  ✅ ${n}`);
  } else {
    fail += 1;
    console.log(`  ❌ ${n}`);
  }
};

const COP = currencyMetaFromRow({ code:'COP', decimal_places:0, zero_decimal:true });
const USD = currencyMetaFromRow({ code:'USD', decimal_places:2, zero_decimal:false });
const PEN = currencyMetaFromRow({ code:'PEN', decimal_places:2, zero_decimal:false });

console.log('── 5.8 Redondeo por moneda ──');
eq('COP (0 decimales) redondea 18000.7 → 18001', roundForCurrency(18000.7, COP), 18001);
eq('COP redondea 17999.4 → 17999', roundForCurrency(17999.4, COP), 17999);
eq('USD (2 decimales) redondea 4.756 → 4.76', roundForCurrency(4.756, USD), 4.76);
eq('PEN redondea 18.005 → 18.01', roundForCurrency(18.005, PEN), 18.01);
eq('USD deja 4.75 intacto', roundForCurrency(4.75, USD), 4.75);

console.log('\n── Unidades menores (lo que se manda a la pasarela) ──');
eq('COP 18000 → 18000 (sin centavos)', toMinorUnits(18000, COP), 18000);
eq('USD 4.75 → 475 centavos', toMinorUnits(4.75, USD), 475);
eq('PEN 18.00 → 1800 céntimos', toMinorUnits(18, PEN), 1800);

console.log('\n── Conversión multi-moneda ──');
const rates = { COP: 1, USD: 4000, MXN: 230, PEN: 1100 };
eq('misma moneda no convierte', convertAmount(100, 'COP', 'COP', rates), 100);
eq('USD 1 → COP 4000', convertAmount(1, 'USD', 'COP', rates), 4000);
eq('COP 4000 → USD 1', convertAmount(4000, 'COP', 'USD', rates), 1);
eq('USD 1 → PEN (4000/1100)', Math.round(convertAmount(1,'USD','PEN',rates)*100)/100, 3.64);
eq('moneda sin tasa devuelve null', convertAmount(10, 'JPY', 'COP', rates), null);
eq('tasa cero devuelve null', convertAmount(10, 'XXX', 'COP', { ...rates, XXX: 0 }), null);
eq('acepta minúsculas', convertAmount(1, 'usd', 'cop', rates), 4000);

console.log('\n── Ida y vuelta no pierde dinero ──');
const ida = convertAmount(18000, 'COP', 'USD', rates);
const vuelta = convertAmount(ida, 'USD', 'COP', rates);
eq('COP 18000 → USD → COP', vuelta, 18000);

console.log('\n── Dirección de envío ──');
const buena = validateShippingAddressInput({ city:'Bogotá', street:'CR 15 100-69', apartment:'605' });
truthy('dirección completa es válida', buena.ok);
const sinCiudad = validateShippingAddressInput({ city:'', street:'CR 15' });
truthy('sin ciudad se rechaza', !sinCiudad.ok);
const sinCalle = validateShippingAddressInput({ city:'Bogotá', street:'' });
truthy('sin dirección se rechaza', !sinCalle.ok);
if (buena.ok) {
  const addr = buildShippingAddress('MX', 'México', buena.data);
  eq('guarda el país del mercado en la dirección', addr.country_code, 'MX');
  eq('guarda el nombre del país', addr.country_name, 'México');
}

console.log(`\n══ ${pass} pasaron, ${fail} fallaron ══`);
process.exit(fail ? 1 : 0);
