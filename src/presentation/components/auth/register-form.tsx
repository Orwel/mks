"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { registerCustomer } from "@/app/(auth)/registro/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LegalConsentCheckbox,
  LegalLink,
} from "@/presentation/components/auth/legal-consent-checkbox";
import { MksField, MksInput } from "@/presentation/components/auth/mks-field";

const schema = z
  .object({
    fullName: z.string().min(2, "Escribe al menos 2 caracteres"),
    email: z.string().email("Correo no válido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
    acceptTerms: z.literal(true, {
      message: "Debes aceptar los Términos y condiciones",
    }),
    acceptPrivacy: z.literal(true, {
      message: "Debes autorizar el tratamiento de tus datos personales",
    }),
    marketingOptIn: z.boolean(),
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
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirm: "",
      // Nunca premarcadas.
      acceptTerms: false as unknown as true,
      acceptPrivacy: false as unknown as true,
      marketingOptIn: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSuccess(null);

    // El alta corre en el servidor para dejar constancia de la aceptación
    // (versión del documento, fecha, IP y user agent) en `legal_acceptances`.
    const result = await registerCustomer({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
      acceptTerms: values.acceptTerms,
      acceptPrivacy: values.acceptPrivacy,
      marketingOptIn: values.marketingOptIn,
      redirectTo: `${window.location.origin}/login`,
    });

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccess(
        "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.",
      );
      return;
    }

    router.push("/mi-cuenta");
    router.refresh();
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

      <fieldset className="space-y-3 rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]/60 p-4">
        <legend className="px-2 text-xs font-black uppercase tracking-[0.15em] text-[var(--mks-ink)]">
          Autorizaciones
        </legend>

        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <LegalConsentCheckbox
              id="acceptTerms"
              checked={!!field.value}
              onChange={field.onChange}
              error={errors.acceptTerms?.message}
            >
              He leído y acepto los{" "}
              <LegalLink href="/terminos">Términos y condiciones</LegalLink> de My Korea
              Store.
            </LegalConsentCheckbox>
          )}
        />

        <Controller
          control={control}
          name="acceptPrivacy"
          render={({ field }) => (
            <LegalConsentCheckbox
              id="acceptPrivacy"
              checked={!!field.value}
              onChange={field.onChange}
              error={errors.acceptPrivacy?.message}
            >
              Autorizo de manera previa, expresa e informada a IKEBANA CO S.A.S. el
              tratamiento de mis datos personales conforme a la{" "}
              <LegalLink href="/privacidad">Política de privacidad</LegalLink>.
            </LegalConsentCheckbox>
          )}
        />

        <Controller
          control={control}
          name="marketingOptIn"
          render={({ field }) => (
            <LegalConsentCheckbox
              id="marketingOptIn"
              checked={!!field.value}
              onChange={field.onChange}
            >
              <span className="text-neutral-600">
                (Opcional) Quiero recibir novedades y promociones por correo. Puedo
                revocarlo en cualquier momento.
              </span>
            </LegalConsentCheckbox>
          )}
        />
      </fieldset>

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
