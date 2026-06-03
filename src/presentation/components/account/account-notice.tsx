type AccountNoticeProps = {
  message: string;
};

/** Aviso breve estilo marca (p. ej. permisos). */
export function AccountNotice({ message }: AccountNoticeProps) {
  return (
    <div
      className="rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)]/25 px-4 py-3 text-sm font-bold text-[var(--mks-ink)]"
      role="status"
    >
      {message}
    </div>
  );
}
