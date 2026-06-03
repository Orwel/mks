type DashboardPageHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
};

/** Encabezado coherente con landing / cuenta (neo-brutalist MKS). */
export function DashboardPageHeader({
  kicker = "Panel administración",
  title,
  description,
}: DashboardPageHeaderProps) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-cyan)]">{kicker}</p>
      <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm font-medium text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}
