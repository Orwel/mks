"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  label: string;
  count?: number;
  onClick?: () => void;
  /** Enlace en lugar de botón (p. ej. página de categoría). */
  href?: string;
};

export function CategoryChip({ active, label, count, onClick, href }: Props) {
  const className = cn(
    "rounded-full border-4 px-4 py-2 text-sm font-black transition shrink-0",
    active
      ? "border-[var(--mks-ink)] bg-[var(--mks-cyan)] text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]"
      : "border-[var(--mks-ink)] bg-white text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40",
  );

  const content = (
    <>
      {label}
      {count !== undefined ? (
        <span className="ml-1.5 text-xs font-bold opacity-70">({count})</span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick ?? (() => {})} className={className}>
      {content}
    </button>
  );
}
