"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/utils";
import { mksButtonClass } from "@/presentation/components/ui/mks-button";
import { isBrowserSupabaseConfigured } from "@/shared/config/env";

type Props = {
  layout?: "inline" | "drawer";
  onNavigate?: () => void;
};

export function AuthNavLinks({ layout = "inline", onNavigate }: Props) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) {
      queueMicrotask(() => {
        setReady(true);
        setLoggedIn(false);
      });
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

  const isDrawer = layout === "drawer";

  if (!ready) {
    return (
      <span
        className={cn(
          "animate-pulse rounded-xl border-4 border-transparent bg-neutral-200/80",
          isDrawer ? "block h-11 w-full" : "hidden h-9 w-20 lg:inline-block",
        )}
        aria-hidden
      />
    );
  }

  const href = loggedIn ? "/mi-cuenta" : "/login";
  const label = loggedIn ? "Mi cuenta" : "Entrar";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        mksButtonClass({
          variant: loggedIn ? "primary" : "accent",
          size: isDrawer ? "md" : "sm",
          className: isDrawer ? "w-full" : "hidden lg:inline-flex",
        }),
      )}
    >
      {label}
    </Link>
  );
}
