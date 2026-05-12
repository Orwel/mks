"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isBrowserSupabaseConfigured } from "@/shared/config/env";

export function AuthNavLinks() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) {
      setReady(true);
      setLoggedIn(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <span
        className="hidden h-9 w-20 animate-pulse rounded-xl border-4 border-transparent bg-neutral-200/80 sm:inline-block"
        aria-hidden
      />
    );
  }

  if (loggedIn) {
    return (
      <Link
        href="/mi-cuenta"
        className={cn(
          buttonVariants({ size: "sm" }),
          "hidden rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-3 py-2 font-black text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-ink)] sm:inline-flex",
        )}
      >
        Mi cuenta
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className={cn(
        buttonVariants({ size: "sm" }),
        "hidden rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-3 py-2 font-black text-white shadow-[3px_3px_0_0_var(--mks-ink)] sm:inline-flex",
      )}
    >
      Entrar
    </Link>
  );
}
