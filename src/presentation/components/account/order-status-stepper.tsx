import { cn } from "@/lib/utils";
import {
  CUSTOMER_ORDER_STEPS,
  getOrderStatusMeta,
  getOrderStepIndex,
  isTerminalOrderStatus,
} from "@/shared/lib/order-status-labels";

type Props = {
  status: string;
  variant?: "mini" | "full";
  className?: string;
};

export function OrderStatusStepper({ status, variant = "mini", className }: Props) {
  const currentIndex = getOrderStepIndex(status);
  const terminal = isTerminalOrderStatus(status) && status !== "delivered";
  const meta = getOrderStatusMeta(status);

  if (terminal) {
    return (
      <div
        className={cn(
          "rounded-lg border-2 border-[var(--mks-ink)] bg-neutral-100 px-3 py-2 text-sm font-bold text-neutral-700",
          className,
        )}
        role="status"
      >
        {meta.label}: {meta.description}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <ol className={cn("space-y-0", className)} aria-label="Progreso del pedido">
        {CUSTOMER_ORDER_STEPS.map((step, index) => {
          const done = currentIndex > index;
          const current = currentIndex === index;
          const pending = currentIndex < index;

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mks-ink)] text-xs font-black",
                    done && "bg-[var(--mks-cyan)] text-[var(--mks-ink)]",
                    current && "bg-[var(--mks-pink)]/30 ring-2 ring-[var(--mks-pink)]",
                    pending && "bg-white text-neutral-400",
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? "✓" : index + 1}
                </span>
                {index < CUSTOMER_ORDER_STEPS.length - 1 ? (
                  <span
                    className={cn(
                      "my-1 w-0.5 flex-1 min-h-6",
                      done ? "bg-[var(--mks-cyan)]" : "bg-neutral-200",
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={cn("pb-6", index === CUSTOMER_ORDER_STEPS.length - 1 && "pb-0")}>
                <p
                  className={cn(
                    "text-sm font-black",
                    current ? "text-[var(--mks-ink)]" : pending ? "text-neutral-400" : "text-[var(--mks-ink)]",
                  )}
                >
                  {step.label}
                </p>
                {current ? (
                  <p className="mt-0.5 text-xs font-medium text-neutral-600">{meta.description}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={CUSTOMER_ORDER_STEPS.length}
      aria-valuenow={currentIndex >= 0 ? currentIndex + 1 : 0}
      aria-label={`Progreso: ${meta.label}`}
    >
      {CUSTOMER_ORDER_STEPS.map((step, index) => {
        const done = currentIndex > index;
        const current = currentIndex === index;

        return (
          <div key={step.key} className="flex flex-1 items-center gap-1">
            <span
              className={cn(
                "h-2 flex-1 rounded-full border border-[var(--mks-ink)]/20",
                done && "bg-[var(--mks-cyan)] border-[var(--mks-ink)]",
                current && "bg-[var(--mks-pink)]/60 border-[var(--mks-ink)]",
                !done && !current && "bg-neutral-100",
              )}
              title={step.label}
            />
          </div>
        );
      })}
    </div>
  );
}
