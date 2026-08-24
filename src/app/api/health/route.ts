import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

/**
 * Latido de la aplicación y de la base de datos.
 *
 * Lo consume el workflow `keep-supabase-alive`: los proyectos gratuitos de
 * Supabase se pausan tras unos días sin actividad, y esta consulta cuenta como
 * actividad real porque llega hasta Postgres, no se queda en la CDN.
 *
 * Nunca se cachea: una respuesta servida desde caché no tocaría la base y el
 * latido sería inútil.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

export async function GET() {
  const startedAt = Date.now();

  try {
    const supabase = await createSupabaseServerClient();

    // `markets` es pequeña y legible por anónimos (RLS: activos o admin).
    const { error, count } = await supabase
      .from("markets")
      .select("code", { count: "exact", head: true })
      .eq("is_active", true);

    if (error) {
      return NextResponse.json(
        { ok: false, db: "error", error: error.message, ms: Date.now() - startedAt },
        { status: 503, headers: NO_STORE },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        db: "up",
        markets: count ?? 0,
        ms: Date.now() - startedAt,
        at: new Date().toISOString(),
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "error desconocido";
    return NextResponse.json(
      { ok: false, db: "unreachable", error: message, ms: Date.now() - startedAt },
      { status: 503, headers: NO_STORE },
    );
  }
}
