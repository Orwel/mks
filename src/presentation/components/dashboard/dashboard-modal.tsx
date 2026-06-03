"use client";

import { useEffect, type ReactNode } from "react";

type DashboardModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
};

export function DashboardModal({ open, onClose, title, children, wide }: DashboardModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[var(--mks-ink)]/40"
        onClick={onClose}
      />
      <div
        className={`relative z-10 max-h-[min(90vh,900px)] w-full overflow-y-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white shadow-[12px_12px_0_0_var(--mks-ink)] ${wide ? "max-w-3xl" : "max-w-2xl"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] px-5 py-3">
          <h2 id="dashboard-modal-title" className="font-heading text-lg font-black text-[var(--mks-ink)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg border-2 border-[var(--mks-ink)] bg-white text-lg font-black leading-none text-[var(--mks-ink)] hover:bg-[var(--mks-cyan)]"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}
