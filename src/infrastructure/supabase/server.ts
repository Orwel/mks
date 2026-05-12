import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getClientEnv } from "@/shared/config/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getClientEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.",
    );
  }
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll llamado desde un Server Component sin mutación de cookies
          }
        },
      },
    },
  );
}
