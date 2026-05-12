import { createClient } from "@supabase/supabase-js";

import { getClientEnv, getServerEnv } from "@/shared/config/env";

/** Cliente con service role: solo servidor, nunca importar en componentes cliente. */
export function createSupabaseAdminClient() {
  const publicEnv = getClientEnv();
  const serverEnv = getServerEnv();
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para el cliente admin.",
    );
  }
  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
