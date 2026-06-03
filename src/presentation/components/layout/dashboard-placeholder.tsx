import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardPlaceholderProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardPlaceholder({ children, className }: DashboardPlaceholderProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-4 border-dashed border-[var(--mks-ink)]/25 bg-white/80 p-6 shadow-[6px_6px_0_0_var(--mks-pink)]/35",
        className,
      )}
    >
      <p className="text-sm font-semibold text-neutral-600">{children}</p>
    </div>
  );
}
