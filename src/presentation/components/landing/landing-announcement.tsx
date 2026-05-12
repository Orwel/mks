"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { AnnouncementRow } from "@/infrastructure/supabase/queries/landing";

const STORAGE_PREFIX = "mks-announcement-dismissed";

type Props = {
  announcement: AnnouncementRow | null;
};

export function LandingAnnouncement({ announcement }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    if (announcement.display_mode !== "modal") return;

    if (announcement.frequency === "always") {
      setOpen(true);
      return;
    }

    const key = `${STORAGE_PREFIX}:${announcement.id}`;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(key)) return;
    setOpen(true);
  }, [announcement]);

  if (!announcement) {
    return null;
  }

  if (announcement.display_mode === "bar") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-4 py-3 text-center text-sm font-bold text-white shadow-[0_-6px_0_0_var(--mks-ink)]">
        <span>{announcement.title}</span>
        {announcement.cta_url && announcement.cta_label && (
          <>
            {" · "}
            <Link href={announcement.cta_url} className="underline">
              {announcement.cta_label}
            </Link>
          </>
        )}
      </div>
    );
  }

  if (announcement.display_mode === "toast") {
    return (
      <div className="pointer-events-none fixed bottom-6 right-4 z-[60] max-w-sm">
        <div className="pointer-events-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white p-4 shadow-[6px_6px_0_0_var(--mks-ink)]">
          <p className="font-heading text-lg font-black text-[var(--mks-ink)]">{announcement.title}</p>
          <p className="mt-2 text-sm text-neutral-700">{announcement.body}</p>
          {announcement.cta_url && announcement.cta_label && (
            <Link
              href={announcement.cta_url}
              className="mt-3 inline-block rounded-lg border-2 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-3 py-1.5 text-sm font-bold text-[var(--mks-ink)]"
            >
              {announcement.cta_label}
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!open) {
    return null;
  }

  const dismiss = () => {
    if (announcement.frequency === "once_per_session" && typeof window !== "undefined") {
      sessionStorage.setItem(`${STORAGE_PREFIX}:${announcement.id}`, "1");
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mks-announcement-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] shadow-[12px_12px_0_0_var(--mks-pink)]">
        {announcement.image_url && (
          <div className="relative aspect-video w-full border-b-4 border-[var(--mks-ink)]">
            <Image src={announcement.image_url} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="p-6">
          <p
            id="mks-announcement-title"
            className="font-heading text-2xl font-black tracking-tight text-[var(--mks-ink)]"
          >
            {announcement.title}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
            {announcement.body}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {announcement.cta_url && announcement.cta_label && (
              <Link
                href={announcement.cta_url}
                className="inline-flex items-center justify-center rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-5 py-2.5 text-sm font-black text-white shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:-translate-y-0.5"
              >
                {announcement.cta_label}
              </Link>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-xl border-4 border-[var(--mks-ink)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
