import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const zero = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);
const stripe = new Set(
  "USD EUR GBP COP MXN BRL ARS CLP PEN CAD AUD NZD CHF SEK NOK DKK PLN CZK HUF RON BGN TRY ILS AED SAR QAR KWD BHD OMN JOD EGP ZAR NGN KES GHS MAD TWD HKD SGD MYR THB IDR PHP VND INR PKR BDT LKR NPR JPY KRW CNY UYU PYG BOB CRC GTQ HNL NIO PAB DOP JMD TTD XCD BBD BSD BMD KYD AWG ANG XPF XAF XOF GIP FJD WST TOP PGK SBD VUV".split(
    " ",
  ),
);
const mp = new Set(["COP", "ARS", "BRL", "MXN", "CLP", "PEN", "UYU"]);

const codes =
  "AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWL".split(
    " ",
  );

const names = {
  AED: "Dirham EAU",
  AFN: "Afgani",
  ALL: "Lek",
  AMD: "Dram armenio",
  ANG: "Florin antillano",
  AOA: "Kwanza",
  ARS: "Peso argentino",
  AUD: "Dolar australiano",
  AWG: "Florin arubeno",
  AZN: "Manat azeri",
  BAM: "Marco convertible",
  BBD: "Dolar barbadense",
  BDT: "Taka",
  BGN: "Lev bulgaro",
  BHD: "Dinar bareini",
  BIF: "Franco burundes",
  BMD: "Dolar bermudeno",
  BND: "Dolar bruneano",
  BOB: "Boliviano",
  BRL: "Real brasileno",
  BSD: "Dolar bahameno",
  BTN: "Ngultrum",
  BWP: "Pula",
  BYN: "Rublo bielorruso",
  BZD: "Dolar beliceno",
  CAD: "Dolar canadiense",
  CDF: "Franco congoleno",
  CHF: "Franco suizo",
  CLP: "Peso chileno",
  CNY: "Yuan chino",
  COP: "Peso colombiano",
  CRC: "Colon costarricense",
  CUP: "Peso cubano",
  CVE: "Escudo caboverdiano",
  CZK: "Corona checa",
  DJF: "Franco yibutiano",
  DKK: "Corona danesa",
  DOP: "Peso dominicano",
  DZD: "Dinar argelino",
  EGP: "Libra egipcia",
  ERN: "Nakfa",
  ETB: "Bir",
  EUR: "Euro",
  FJD: "Dolar fiyiano",
  FKP: "Libra malvinense",
  GBP: "Libra esterlina",
  GEL: "Lari",
  GHS: "Cedi",
  GIP: "Libra gibraltarena",
  GMD: "Dalasi",
  GNF: "Franco guineano",
  GTQ: "Quetzal",
  GYD: "Dolar guyanes",
  HKD: "Dolar hongkones",
  HNL: "Lempira",
  HTG: "Gourde",
  HUF: "Forinto",
  IDR: "Rupia indonesia",
  ILS: "Nuevo shekel",
  INR: "Rupia india",
  IQD: "Dinar iraqui",
  IRR: "Rial irani",
  ISK: "Corona islandesa",
  JMD: "Dolar jamaicano",
  JOD: "Dinar jordano",
  JPY: "Yen",
  KES: "Chelin keniano",
  KGS: "Som",
  KHR: "Riel",
  KMF: "Franco comorense",
  KPW: "Won norcoreano",
  KRW: "Won surcoreano",
  KWD: "Dinar kuwaiti",
  KYD: "Dolar caiman",
  KZT: "Tenge",
  LAK: "Kip",
  LBP: "Libra libanesa",
  LKR: "Rupia esrilanquesa",
  LRD: "Dolar liberiano",
  LSL: "Loti",
  LYD: "Dinar libio",
  MAD: "Dirham marroqui",
  MDL: "Leu moldavo",
  MGA: "Ariary",
  MKD: "Denar",
  MMK: "Kyat",
  MNT: "Tugrik",
  MOP: "Pataca",
  MRU: "Ouguiya",
  MUR: "Rupia mauriciana",
  MVR: "Rupia maldiva",
  MWK: "Kwacha",
  MXN: "Peso mexicano",
  MYR: "Ringgit",
  MZN: "Metical",
  NAD: "Dolar namibio",
  NGN: "Naira",
  NIO: "Cordoba",
  NOK: "Corona noruega",
  NPR: "Rupia nepalesa",
  NZD: "Dolar neozelandes",
  OMR: "Rial omani",
  PAB: "Balboa",
  PEN: "Sol peruano",
  PGK: "Kina",
  PHP: "Peso filipino",
  PKR: "Rupia pakistani",
  PLN: "Zloty",
  PYG: "Guarani",
  QAR: "Rial catari",
  RON: "Leu rumano",
  RSD: "Dinar serbio",
  RUB: "Rublo ruso",
  RWF: "Franco ruandes",
  SAR: "Riyal saudi",
  SBD: "Dolar salomonense",
  SCR: "Rupia seychellense",
  SDG: "Libra sudanesa",
  SEK: "Corona sueca",
  SGD: "Dolar singapurense",
  SHP: "Libra santahelenense",
  SLE: "Leone",
  SOS: "Chelin somali",
  SRD: "Dolar surinames",
  SSP: "Libra sursudanesa",
  STN: "Dobra",
  SYP: "Libra siria",
  SZL: "Lilangeni",
  THB: "Baht",
  TJS: "Somoni",
  TMT: "Manat turcomano",
  TND: "Dinar tunecino",
  TOP: "Paanga",
  TRY: "Lira turca",
  TTD: "Dolar trinitense",
  TWD: "Dolar taiwanes",
  TZS: "Chelin tanzano",
  UAH: "Grivna",
  UGX: "Chelin ugandes",
  USD: "Dolar estadounidense",
  UYU: "Peso uruguayo",
  UZS: "Som uzbeko",
  VES: "Bolivar",
  VND: "Dong",
  VUV: "Vatu",
  WST: "Tala",
  XAF: "Franco CFA BEAC",
  XCD: "Dolar del Caribe Oriental",
  XOF: "Franco CFA BCEAO",
  XPF: "Franco CFP",
  YER: "Rial yemeni",
  ZAR: "Rand",
  ZMW: "Kwacha zambiano",
  ZWL: "Dolar zimbabuense",
};

const values = codes
  .map((c) => {
    const z = zero.has(c);
    const dp = z ? 0 : 2;
    const sp = stripe.has(c);
    const mpv = mp.has(c);
    const n = (names[c] ?? c).replace(/'/g, "''");
    return `  ('${c}', '${n}', '${c}', ${dp}, ${z}, ${sp}, ${mpv}, true)`;
  })
  .join(",\n");

const sql = `-- Generated by scripts/generate-currencies-seed.mjs
create table if not exists public.currencies (
  code char(3) primary key,
  name text not null,
  symbol text not null default '',
  decimal_places smallint not null default 2 check (decimal_places >= 0 and decimal_places <= 4),
  zero_decimal boolean not null default false,
  stripe_presentment boolean not null default false,
  mercadopago_supported boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.currencies enable row level security;

drop policy if exists "currencies_select_all" on public.currencies;
create policy "currencies_select_all" on public.currencies for select using (is_active = true or public.is_admin());

insert into public.currencies (
  code, name, symbol, decimal_places, zero_decimal, stripe_presentment, mercadopago_supported, is_active
)
values
${values}
on conflict (code) do update set
  name = excluded.name,
  symbol = excluded.symbol,
  decimal_places = excluded.decimal_places,
  zero_decimal = excluded.zero_decimal,
  stripe_presentment = excluded.stripe_presentment,
  mercadopago_supported = excluded.mercadopago_supported,
  is_active = excluded.is_active;
`;

const out = join(__dirname, "..", "supabase", "migrations", "20250602100000_sprint2_currencies.sql");
writeFileSync(out, sql, "utf8");
console.log("Wrote", out, "with", codes.length, "currencies");
