import Image from "next/image";
import Link from "next/link";

import { AuthLogoMark, LoginForm } from "@/presentation/components/auth/login-form";
import { brandAssets } from "@/shared/constants/brand";

export default function LoginPage() {
  return (
    <>
      <AuthLogoMark />
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-black tracking-tight text-[var(--mks-ink)] md:text-3xl">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Accedé a tu cuenta. El panel de administración de la tienda es solo para cuentas con rol
          administrador.
        </p>
      </div>
      <LoginForm />
      <div className="mt-8 flex justify-center">
        <Link href="/" className="group relative">
          <span className="text-xs font-black uppercase tracking-widest text-[var(--mks-pink)] group-hover:underline">
            ← Volver al inicio
          </span>
        </Link>
      </div>
      <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-[0.07]">
        <Image src={brandAssets.logoPrimary} alt="" width={200} height={200} className="rotate-12" />
      </div>
    </>
  );
}
