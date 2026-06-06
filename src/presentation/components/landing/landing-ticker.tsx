import Link from "next/link";

import type { TickerRow } from "@/infrastructure/supabase/queries/landing";

const FALLBACK_MESSAGES = [
  "Envío a todo Colombia",
  "Productos auténticos desde Corea",
  "Pagos con Mercado Pago",
  "MY KOREA STORE — para K-lovers",
];

type Props = {
  messages: TickerRow[];
};

export function LandingTicker({ messages }: Props) {
  const items =
    messages.length > 0
      ? messages
      : FALLBACK_MESSAGES.map((message, i) => ({
          id: `fallback-${i}`,
          message,
          link_url: null as string | null,
          sort_order: i,
        }));

  const doubled = [...items, ...items];

  return (
    <div className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] text-[var(--mks-ink)]">
      <div className="flex overflow-hidden py-2.5">
        <ul className="animate-mks-marquee flex shrink-0 items-center gap-10 whitespace-nowrap px-4 text-sm font-bold uppercase tracking-widest">
          {doubled.map((m, idx) => (
            <li key={`${m.id}-${idx}`} className="flex items-center gap-10">
              {m.link_url ? (
                <Link href={m.link_url} className="hover:underline">
                  {m.message}
                </Link>
              ) : (
                <span>{m.message}</span>
              )}
              <span className="text-[var(--mks-pink)]" aria-hidden>
                ✦
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
