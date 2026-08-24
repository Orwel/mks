"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  id: string;
  name?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
  /** Sólo para formularios no controlados (checkout). */
  defaultChecked?: boolean;
};

/**
 * Casilla de consentimiento. Nunca se entrega premarcada: la Ley 1581 de 2012
 * exige una manifestación de voluntad previa, expresa e informada.
 */
export function LegalConsentCheckbox({
  id,
  name,
  checked,
  onChange,
  error,
  children,
  defaultChecked,
}: Props) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 text-sm font-medium leading-relaxed text-neutral-800"
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--mks-pink)]"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} role="alert" className="pl-8 text-sm font-bold text-[var(--mks-pink)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Enlace al acto jurídico, embebido dentro del texto de la casilla. */
export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-black text-[var(--mks-pink)] underline decoration-2 underline-offset-2"
    >
      {children}
    </Link>
  );
}
