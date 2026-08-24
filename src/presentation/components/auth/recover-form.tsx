"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/utils";
import { MksField, MksInput } from "@/presentation/components/auth/mks-field";

const schema = z.object({
  email: z.string().email("Correo no válido"),
});

type FormValues = z.infer<typeof schema>;

export function RecoverForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSuccess(false);
    const supabase = createSupabaseBrowserClient();
    // Debe apuntar a /restablecer: si apunta a /login la sesión de recuperación
    // deja al usuario dentro de la app sin haber cambiado la contraseña.
    const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
      redirectTo: `${window.location.origin}/restablecer`,
    });

    if (error) {
      setServerError(error.message);
      return;
    }
    setSuccess(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm font-medium leading-relaxed text-neutral-700">
        Te enviaremos un enlace para restablecer la contraseña (revisa también spam).
      </p>

      {serverError && (
        <div
          className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)]/15 px-4 py-3 text-sm font-bold text-[var(--mks-ink)]"
          role="alert"
        >
          {serverError}
        </div>
      )}
      {success && (
        <div className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)]/40 px-4 py-3 text-sm font-bold text-[var(--mks-ink)]">
          Si el correo está registrado, recibirás el enlace en unos minutos.
        </div>
      )}

      <MksField id="email" label="Correo" error={errors.email?.message}>
        <MksInput
          id="email"
          type="email"
          autoComplete="email"
          placeholder="hola@ejemplo.com"
          invalid={!!errors.email}
          {...register("email")}
        />
      </MksField>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 w-full rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] text-base font-black text-white shadow-[6px_6px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)] disabled:opacity-60",
        )}
      >
        {isSubmitting ? "Enviando…" : "Enviar enlace"}
      </button>

      <p className="text-center text-sm font-semibold">
        <Link href="/login" className="font-black text-[var(--mks-ink)] underline decoration-[var(--mks-cyan)] decoration-4">
          Volver al inicio de sesión
        </Link>
      </p>
    </form>
  );
}
