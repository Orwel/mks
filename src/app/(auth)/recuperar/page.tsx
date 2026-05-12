import Image from "next/image";
import Link from "next/link";

import { AuthLogoMark } from "@/presentation/components/auth/login-form";
import { RecoverForm } from "@/presentation/components/auth/recover-form";
import { brandAssets } from "@/shared/constants/brand";

export default function RecuperarPage() {
  return (
    <>
      <AuthLogoMark />
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-black tracking-tight text-[var(--mks-ink)] md:text-3xl">
          Recuperar acceso
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Te mandamos un enlace seguro para nueva contraseña.
        </p>
      </div>
      <RecoverForm />
      <div className="mt-8 flex justify-center">
        <Link href="/" className="text-xs font-black uppercase tracking-widest text-[var(--mks-cyan)] hover:underline">
          ← Volver al inicio
        </Link>
      </div>
      <div className="pointer-events-none absolute top-1/2 -right-10 -translate-y-1/2 opacity-[0.06]">
        <Image src={brandAssets.logoOrange} alt="" width={160} height={160} className="rotate-6" />
      </div>
    </>
  );
}
