"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/utils";
import { MksField, MksInput } from "@/presentation/components/auth/mks-field";

const schema = z
  .object({
    fullName: z.string().min(2, "Escribe al menos 2 caracteres"),
    email: z.string().email("Correo no válido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSuccess(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          full_name: values.fullName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (data.session) {
      router.push("/mi-cuenta");
      router.refresh();
      return;
    }

    setSuccess(
      "Revisa tu correo para confirmar la cuenta (si tu proyecto Supabase tiene confirmación por email activada). Luego puedes iniciar sesión.",
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          {success}
        </div>
      )}

      <MksField id="fullName" label="Nombre completo" error={errors.fullName?.message}>
        <MksInput
          id="fullName"
          autoComplete="name"
          placeholder="Tu nombre"
          invalid={!!errors.fullName}
          {...register("fullName")}
        />
      </MksField>

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

      <MksField id="password" label="Contraseña" error={errors.password?.message}>
        <MksInput
          id="password"
          type="password"
          autoComplete="new-password"
          invalid={!!errors.password}
          {...register("password")}
        />
      </MksField>

      <MksField id="confirm" label="Confirmar contraseña" error={errors.confirm?.message}>
        <MksInput
          id="confirm"
          type="password"
          autoComplete="new-password"
          invalid={!!errors.confirm}
          {...register("confirm")}
        />
      </MksField>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 w-full rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] text-base font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)] disabled:opacity-60",
        )}
      >
        {isSubmitting ? "Creando…" : "Crear cuenta"}
      </button>

      <p className="border-t-4 border-dashed border-[var(--mks-ink)]/15 pt-6 text-center text-sm font-semibold text-neutral-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-black text-[var(--mks-pink)] underline decoration-2">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
