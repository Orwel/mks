"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { AnnouncementRow } from "@/infrastructure/supabase/queries/landing";
import { RemoteImage } from "@/presentation/components/ui/remote-image";

const STORAGE_PREFIX = "mks-announcement-dismissed";

type Props = {
  announcements: AnnouncementRow[];
};

function isDismissed(announcement: AnnouncementRow): boolean {
  if (typeof window === "undefined") return true;
  if (announcement.frequency === "always") return false;

  const key = `${STORAGE_PREFIX}:${announcement.id}`;
  if (announcement.frequency === "once_per_session") {
    return sessionStorage.getItem(key) === "1";
  }
  if (announcement.frequency === "once_per_user") {
    return localStorage.getItem(key) === "1";
  }
  return false;
}

function markDismissed(announcement: AnnouncementRow): void {
  if (typeof window === "undefined") return;
  if (announcement.frequency === "always") return;

  const key = `${STORAGE_PREFIX}:${announcement.id}`;
  if (announcement.frequency === "once_per_session") {
    sessionStorage.setItem(key, "1");
  } else if (announcement.frequency === "once_per_user") {
    localStorage.setItem(key, "1");
  }
}

export function LandingAnnouncement({ announcements }: Props) {
  const modalQueue = useMemo(
    () => announcements.filter((a) => a.display_mode === "modal"),
    [announcements],
  );
  const barAnnouncement = useMemo(
    () => announcements.find((a) => a.display_mode === "bar"),
    [announcements],
  );
  const toastAnnouncement = useMemo(
    () => announcements.find((a) => a.display_mode === "toast"),
    [announcements],
  );

  const [queueIndex, setQueueIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const findFirstPendingIndex = useCallback(() => {
    const idx = modalQueue.findIndex((a) => !isDismissed(a));
    return idx >= 0 ? idx : -1;
  }, [modalQueue]);

  useEffect(() => {
    const idx = findFirstPendingIndex();
    queueMicrotask(() => {
      setQueueIndex(idx >= 0 ? idx : modalQueue.length);
      setReady(true);
    });
  }, [findFirstPendingIndex, modalQueue.length]);

  const currentModal = ready && queueIndex < modalQueue.length ? modalQueue[queueIndex] : null;
  const modalOpen = Boolean(currentModal);

  const dismissModal = () => {
    if (!currentModal) return;
    markDismissed(currentModal);
    for (let i = queueIndex + 1; i < modalQueue.length; i++) {
      if (!isDismissed(modalQueue[i]!)) {
        setQueueIndex(i);
        return;
      }
    }
    setQueueIndex(modalQueue.length);
  };

  if (announcements.length === 0) {
    return null;
  }

  return (
    <>
      {barAnnouncement ? (
        <div className="fixed bottom-[var(--mks-mobile-nav-h)] left-0 right-0 z-[60] border-t-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-4 py-3 text-center text-sm font-bold text-white shadow-[0_-6px_0_0_var(--mks-ink)] lg:bottom-0">
          <span>{barAnnouncement.title}</span>
          {barAnnouncement.cta_url && barAnnouncement.cta_label ? (
            <>
              {" · "}
              <Link href={barAnnouncement.cta_url} className="underline">
                {barAnnouncement.cta_label}
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      {toastAnnouncement ? (
        <div className="pointer-events-none fixed bottom-[calc(var(--mks-mobile-nav-h)+1rem)] right-4 z-[60] max-w-sm lg:bottom-6">
          <div className="pointer-events-auto rounded-xl border-4 border-[var(--mks-ink)] bg-white p-4 shadow-[6px_6px_0_0_var(--mks-ink)]">
            <p className="font-heading text-lg font-black text-[var(--mks-ink)]">{toastAnnouncement.title}</p>
            <p className="mt-2 text-sm text-neutral-700">{toastAnnouncement.body}</p>
            {toastAnnouncement.cta_url && toastAnnouncement.cta_label ? (
              <Link
                href={toastAnnouncement.cta_url}
                className="mt-3 inline-block rounded-lg border-2 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-3 py-1.5 text-sm font-bold text-[var(--mks-ink)]"
              >
                {toastAnnouncement.cta_label}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {modalOpen && currentModal ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mks-announcement-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] shadow-[12px_12px_0_0_var(--mks-pink)]">
            {currentModal.image_url ? (
              <div className="relative aspect-video w-full border-b-4 border-[var(--mks-ink)]">
                <RemoteImage src={currentModal.image_url} alt="" fill className="object-cover" />
              </div>
            ) : null}
            <div className="p-6">
              <p
                id="mks-announcement-title"
                className="font-heading text-2xl font-black tracking-tight text-[var(--mks-ink)]"
              >
                {currentModal.title}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                {currentModal.body}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {currentModal.cta_url && currentModal.cta_label ? (
                  <Link
                    href={currentModal.cta_url}
                    className="inline-flex items-center justify-center rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-5 py-2.5 text-sm font-black text-white shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:bg-[var(--mks-yellow)] hover:-translate-y-0.5"
                  >
                    {currentModal.cta_label}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={dismissModal}
                  className="inline-flex items-center justify-center rounded-xl border-4 border-[var(--mks-ink)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-ink)]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
