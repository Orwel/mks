import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().length(3).default("COP"),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  MP_TEST_PAYER_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
});

/** Vacío / solo espacios → undefined (evita que "" rompa .url() / .min(1)). */
function str(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t === "" ? undefined : t;
}

function pickClientEnv(): z.input<typeof clientEnvSchema> {
  return {
    NEXT_PUBLIC_SITE_URL: str(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_SUPABASE_URL: str(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_DEFAULT_CURRENCY:
      str(process.env.NEXT_PUBLIC_DEFAULT_CURRENCY) ?? "COP",
  };
}

/** True si hay URL y anon key no vacías (cliente / SSR con env cargado). */
export function isBrowserSupabaseConfigured(): boolean {
  const u = str(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const k = str(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return Boolean(u && k);
}

/** Variables públicas (seguras en el cliente). */
export function getClientEnv() {
  return clientEnvSchema.parse(pickClientEnv());
}

/** Variables de servidor; solo importar desde Server Components / Route Handlers / acciones. */
export function getServerEnv() {
  return serverEnvSchema.parse({
    ...pickClientEnv(),
    SUPABASE_SERVICE_ROLE_KEY: str(process.env.SUPABASE_SERVICE_ROLE_KEY),
    MP_ACCESS_TOKEN: str(process.env.MP_ACCESS_TOKEN),
    MP_WEBHOOK_SECRET: str(process.env.MP_WEBHOOK_SECRET),
    MP_TEST_PAYER_EMAIL: str(process.env.MP_TEST_PAYER_EMAIL),
    RESEND_API_KEY: str(process.env.RESEND_API_KEY),
    RESEND_FROM_EMAIL: str(process.env.RESEND_FROM_EMAIL),
  });
}
