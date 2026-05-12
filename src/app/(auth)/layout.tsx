import Image from "next/image";
import Link from "next/link";

import { brandAssets } from "@/shared/constants/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-[var(--mks-cream)] via-white to-[var(--mks-cyan)]/20 px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[var(--mks-pink)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[var(--mks-cyan)]/25 blur-3xl" />

      <div className="pointer-events-none absolute left-6 top-6 hidden opacity-[0.12] md:block">
        <Image src={brandAssets.logoPrimary} alt="" width={100} height={100} className="-rotate-6" />
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 hidden opacity-[0.1] md:block">
        <Image src={brandAssets.logoPink} alt="" width={90} height={90} className="rotate-12" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 rounded-2xl bg-[var(--mks-pink)]/30 blur-sm" aria-hidden />
        <div className="relative rounded-2xl border-4 border-[var(--mks-ink)] bg-white/95 p-8 shadow-[12px_12px_0_0_var(--mks-ink)] backdrop-blur-sm md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
