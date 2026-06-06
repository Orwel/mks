"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { SignOutButton } from "@/presentation/components/auth/sign-out-button";
import { cn } from "@/lib/utils";
import { MksDrawer } from "@/presentation/components/ui/mks-drawer";
import { mksButtonClass } from "@/presentation/components/ui/mks-button";
import { brandAssets } from "@/shared/constants/brand";

const NAV_LINKS = [
  { href: "/catalogo", label: "Tienda" },
  { href: "/mi-cuenta", label: "Mi cuenta" },
  { href: "/mis-pedidos", label: "Mis pedidos" },
] as const;

export function AccountTopBar({ showAdminLink }: { showAdminLink: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={close}>
          <Image
            src={brandAssets.logoHeader}
            alt="My Korea Store"
            width={160}
            height={44}
            className="h-8 w-auto md:h-9"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-2 md:gap-4 lg:flex">
          {showAdminLink ? (
            <Link
              href="/dashboard"
              className={mksButtonClass({ variant: "accent", size: "sm" })}
            >
              Panel admin
            </Link>
          ) : null}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
            >
              {link.label}
            </Link>
          ))}
          <SignOutButton variant="outline" />
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <SignOutButton variant="outline" className="hidden min-[480px]:inline-flex" />
          <button
            type="button"
            className="min-h-11 rounded-lg border-2 border-[var(--mks-ink)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--mks-ink)]"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="account-nav-drawer"
          >
            {open ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      <MksDrawer
        open={open}
        onClose={close}
        id="account-nav-drawer"
        title="Tu cuenta"
        eyebrow="My Korea Store"
        side="left"
        footer={
          <div className="min-[480px]:hidden">
            <SignOutButton variant="solid" className="w-full justify-center" />
          </div>
        }
      >
        <nav className="space-y-1">
          {showAdminLink ? (
            <Link
              href="/dashboard"
              onClick={close}
              className={cn(
                mksButtonClass({ variant: "accent", size: "md" }),
                "mb-4 w-full",
              )}
            >
              Panel admin
            </Link>
          ) : null}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="block rounded-lg border-2 border-transparent px-3 py-2.5 text-sm font-bold text-[var(--mks-ink)] hover:border-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]/40"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={close}
            className="mt-4 block rounded-lg px-3 py-2 text-xs font-bold text-neutral-600 hover:text-[var(--mks-ink)]"
          >
            Volver a la tienda
          </Link>
        </nav>
      </MksDrawer>
    </header>
  );
}
