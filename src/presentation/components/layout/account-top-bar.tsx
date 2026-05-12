import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/presentation/components/auth/sign-out-button";
import { brandAssets } from "@/shared/constants/brand";

export function AccountTopBar() {
  return (
    <header className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={brandAssets.logoHeader}
            alt="My Korea Store"
            width={160}
            height={44}
            className="h-8 w-auto md:h-9"
            priority
          />
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <Link
            href="/catalogo"
            className="rounded-lg px-2 py-1 text-sm font-bold text-[var(--mks-ink)] hover:bg-[var(--mks-cyan)]/35 md:px-3"
          >
            Tienda
          </Link>
          <Link
            href="/mi-cuenta"
            className="rounded-lg px-2 py-1 text-sm font-bold text-[var(--mks-ink)] hover:bg-[var(--mks-pink)]/20 md:px-3"
          >
            Mi cuenta
          </Link>
          <SignOutButton variant="outline" />
        </nav>
      </div>
    </header>
  );
}
