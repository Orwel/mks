"use client";

import { useActionState } from "react";

import {
  submitContactMessage,
  type ContactFormState,
} from "@/app/(public)/contactanos/actions";
import { cn } from "@/lib/utils";
import { MksField, MksInput } from "@/presentation/components/auth/mks-field";

const TEXTAREA_CLASS =
  "w-full min-h-[140px] resize-y rounded-xl border-4 border-[var(--mks-ink)] bg-white px-4 py-3 text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-cyan)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--mks-pink)] focus:shadow-[4px_4px_0_0_var(--mks-pink)]";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactFormState | null, FormData>(
    submitContactMessage,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.message ? (
        <p
          className={cn(
            "rounded-xl border-4 px-4 py-3 text-sm font-bold",
            state.ok
              ? "border-green-700 bg-green-50 text-green-800"
              : "border-[var(--mks-pink)] bg-[var(--mks-pink)]/10 text-[var(--mks-pink)]",
          )}
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <MksField id="contact-name" label="Nombre">
        <MksInput
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Tu nombre"
          required
          minLength={2}
          disabled={pending}
        />
      </MksField>

      <MksField id="contact-email" label="Correo electrónico">
        <MksInput
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          disabled={pending}
        />
      </MksField>

      <MksField id="contact-message" label="Mensaje">
        <textarea
          id="contact-message"
          name="message"
          className={TEXTAREA_CLASS}
          placeholder="Cuéntanos en qué podemos ayudarte…"
          required
          minLength={10}
          disabled={pending}
        />
      </MksField>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-6 py-3 text-sm font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)] disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
