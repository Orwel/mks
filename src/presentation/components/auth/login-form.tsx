"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/utils";
import { MksField, MksInput } from "@/presentation/components/auth/mks-field";
import { brandAssets } from "@/shared/constants/brand";

const schema = z.object({
  email: z.string().email("Correo no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/mi-cuenta";
  const errorParam = searchParams.get("error");

  const [serverError, setServerError] = useState<string | null>(
    errorParam === "cuenta_inactiva"
      ? "Tu cuenta de staff está desactivada. Contacta al administrador."
      : errorParam === "no_staff"
        ? "Necesitas una cuenta de empleado o administrador para entrar al panel."
        : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });

    if (error) {
      setServerError(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : error.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setServerError("No se pudo obtener la sesión. Intenta de nuevo.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const role = profile?.role as string | undefined;
    let target = next;
    if (role === "admin" || role === "employee") {
      if (
        next === "/" ||
        next === "/mi-cuenta" ||
        next.startsWith("/mis-pedidos")
      ) {
        target = "/dashboard";
      } else {
        target = next;
      }
    } else {
      if (next.startsWith("/dashboard")) {
        target = "/mi-cuenta";
      }
      if (!target.startsWith("/")) {
        target = "/mi-cuenta";
      }
    }

    router.push(target);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div
          className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)]/15 px-4 py-3 text-sm font-bold text-[var(--mks-ink)]"
          role="alert"
        >
          {serverError}
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

      <MksField id="password" label="Contraseña" error={errors.password?.message}>
        <MksInput
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={!!errors.password}
          {...register("password")}
        />
      </MksField>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 w-full rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] text-base font-black text-white shadow-[6px_6px_0_0_var(--mks-ink)] hover:opacity-95 disabled:opacity-60",
        )}
      >
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>

      <div className="flex flex-col gap-3 border-t-4 border-dashed border-[var(--mks-ink)]/20 pt-6 text-center text-sm font-semibold">
        <Link href="/recuperar" className="text-[var(--mks-pink)] underline decoration-2 underline-offset-4">
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-neutral-600">
          ¿Sin cuenta?{" "}
          <Link href="/registro" className="font-black text-[var(--mks-ink)] underline decoration-[var(--mks-cyan)] decoration-4 underline-offset-2">
            Crear cuenta
          </Link>
        </p>
      </div>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded-xl bg-neutral-200" />
          <div className="h-12 rounded-xl bg-neutral-200" />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}

export function AuthLogoMark() {
  return (
    <Link href="/" className="mx-auto mb-2 block w-fit">
      <Image
        src={brandAssets.logoHeader}
        alt="My Korea Store"
        width={180}
        height={50}
        className="h-10 w-auto"
        priority
      />
    </Link>
  );
}
