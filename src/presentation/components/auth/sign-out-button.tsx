"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "solid" | "outline";
  className?: string;
  label?: string;
};

export function SignOutButton({
  variant = "outline",
  className,
  label = "Salir",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const base =
    variant === "solid"
      ? "border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] font-black text-white shadow-[4px_4px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)]"
      : "border-4 border-[var(--mks-ink)] bg-white font-bold text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-cyan)] hover:bg-[var(--mks-yellow)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(buttonVariants({ size: "sm" }), base, "rounded-xl", className)}
    >
      {loading ? "…" : label}
    </button>
  );
}
