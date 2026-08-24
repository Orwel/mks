"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { cn } from "@/lib/utils";
import { MksField, MksInput } from "@/presentation/components/auth/mks-field";

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

type LinkState = "checking" | "ready" | "invalid";

export function ResetPasswordForm() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  // El enlace del correo entrega una sesión de recuperación. Antes el
  // `redirectTo` apuntaba a /login, así que esa sesión dejaba al usuario dentro
  // de la app sin haber cambiado nunca la clave. Aquí sólo la usamos para
  // autorizar el cambio de contraseña.
  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setLinkState("ready");
      }
    });

    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorDescription =
      params.get("error_description") ?? hash.get("error_description");

    void (async () => {
      if (errorDescription) {
        if (!active) return;
        setServerError(errorDescription);
        setLinkState("invalid");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setLinkState("ready");
        return;
      }

      // `detectSessionInUrl` puede tardar un instante en canjear el `code`.
      window.setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (!active) return;
        setLinkState(retry.session ? "ready" : "invalid");
      }, 1200);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      setServerError(error.message);
      return;
    }

    // Cerrar la sesión de recuperación: se entra de nuevo con la clave nueva.
    await supabase.auth.signOut();
    setDone(true);
    router.refresh();
    window.setTimeout(() => router.push("/login"), 1800);
  };

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)]/40 px-4 py-3 text-sm font-bold text-[var(--mks-ink)]">
          Contraseña actualizada. Te llevamos al inicio de sesión…
        </div>
        <Link
          href="/login"
          className="font-black text-[var(--mks-pink)] underline decoration-2 underline-offset-4"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (linkState === "checking") {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 rounded-xl bg-neutral-200" />
        <div className="h-12 rounded-xl bg-neutral-200" />
      </div>
    );
  }

  if (linkState === "invalid") {
    return (
      <div className="space-y-6">
        <div
          className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)]/15 px-4 py-3 text-sm font-bold text-[var(--mks-ink)]"
          role="alert"
        >
          {serverError ??
            "El enlace no es válido o ya caducó. Pide uno nuevo para restablecer la contraseña."}
        </div>
        <Link
          href="/recuperar"
          className={cn(
            buttonVariants({ size: "lg" }),
            "flex h-12 w-full items-center justify-center rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] text-base font-black text-white shadow-[6px_6px_0_0_var(--mks-ink)]",
          )}
        >
          Pedir enlace nuevo
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm font-medium leading-relaxed text-neutral-700">
        Escribe tu contraseña nueva. Al guardarla cerraremos esta sesión temporal para
        que entres con la clave nueva.
      </p>

      {serverError && (
        <div
          className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)]/15 px-4 py-3 text-sm font-bold text-[var(--mks-ink)]"
          role="alert"
        >
          {serverError}
        </div>
      )}

      <MksField id="password" label="Contraseña nueva" error={errors.password?.message}>
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
          "h-12 w-full rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] text-base font-black text-white shadow-[6px_6px_0_0_var(--mks-ink)] hover:bg-[var(--mks-yellow)] disabled:opacity-60",
        )}
      >
        {isSubmitting ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
