"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  id: string;
  title: string;
  eyebrow?: string;
  side?: "left" | "right";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function MksDrawer({
  open,
  onClose,
  id,
  title,
  eyebrow = "Tienda",
  side = "left",
  children,
  footer,
  className,
}: Props) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const isLeft = side === "left";

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Cerrar panel"
        className="fixed inset-0 z-[80] bg-[var(--mks-ink)]/40 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed inset-y-0 z-[90] flex h-dvh max-h-dvh w-full max-w-sm flex-col border-[var(--mks-ink)] bg-[var(--mks-cream)] lg:hidden",
          isLeft
            ? "left-0 border-r-4 shadow-[8px_0_0_0_var(--mks-cyan)]"
            : "right-0 border-l-4 shadow-[-8px_0_0_0_var(--mks-cyan)]",
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b-4 border-[var(--mks-ink)] bg-white px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mks-cyan)]">
              {eyebrow}
            </p>
            <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-4 border-[var(--mks-ink)] bg-white p-2 text-[var(--mks-ink)] shadow-[3px_3px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">{children}</div>

        {footer ? (
          <div className="shrink-0 space-y-2 border-t-4 border-[var(--mks-ink)] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </aside>
    </>,
    document.body,
  );
}
