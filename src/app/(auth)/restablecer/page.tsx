import Link from "next/link";

import { AuthLogoMark } from "@/presentation/components/auth/login-form";
import { ResetPasswordForm } from "@/presentation/components/auth/reset-password-form";

export const metadata = {
  title: "Restablecer contraseña",
  robots: { index: false, follow: false },
};

export default function RestablecerPage() {
  return (
    <>
      <AuthLogoMark />
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-black tracking-tight text-[var(--mks-ink)] md:text-3xl">
          Nueva contraseña
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Último paso: define la contraseña con la que entrarás a tu cuenta.
        </p>
      </div>
      <ResetPasswordForm />
      <div className="mt-8 flex justify-center">
        <Link
          href="/login"
          className="text-xs font-black uppercase tracking-widest text-[var(--mks-pink)] hover:underline"
        >
          ← Volver al inicio de sesión
        </Link>
      </div>
    </>
  );
}
