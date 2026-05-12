import Image from "next/image";
import Link from "next/link";

import { AuthLogoMark } from "@/presentation/components/auth/login-form";
import { RegisterForm } from "@/presentation/components/auth/register-form";
import { brandAssets } from "@/shared/constants/brand";

export default function RegistroPage() {
  return (
    <>
      <AuthLogoMark />
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-black tracking-tight text-[var(--mks-ink)] md:text-3xl">
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Cliente nuevo: pedidos, favoritos y novedades (próximamente más perks).
        </p>
      </div>
      <RegisterForm />
      <div className="mt-8 flex justify-center">
        <Link href="/" className="text-xs font-black uppercase tracking-widest text-[var(--mks-pink)] hover:underline">
          ← Volver al inicio
        </Link>
      </div>
      <div className="pointer-events-none absolute -top-4 -left-6 opacity-[0.08]">
        <Image src={brandAssets.logoPink} alt="" width={120} height={120} className="-rotate-6" />
      </div>
    </>
  );
}
