import { cn } from "@/lib/utils";
import { getOrderStatusMeta } from "@/shared/lib/order-status-labels";

type Props = {
  status: string;
  className?: string;
};

export function OrderStatusBadge({ status, className }: Props) {
  const meta = getOrderStatusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border-2 border-[var(--mks-ink)] px-2 py-0.5 text-xs font-black uppercase tracking-wide",
        meta.badgeClass,
        className,
      )}
      aria-label={`Estado: ${meta.label}`}
    >
      {meta.label}
    </span>
  );
}
