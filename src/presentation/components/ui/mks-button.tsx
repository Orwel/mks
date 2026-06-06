import Link from "next/link";

import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "border-[var(--mks-ink)] bg-[var(--mks-cyan)] text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]",
  accent:
    "border-[var(--mks-ink)] bg-[var(--mks-pink)] text-white hover:bg-[var(--mks-yellow)] hover:text-[var(--mks-ink)]",
  outline:
    "border-[var(--mks-ink)] bg-white text-[var(--mks-ink)] hover:bg-[var(--mks-yellow)]",
  ghost:
    "border-transparent bg-transparent text-[var(--mks-ink)] shadow-none hover:bg-[var(--mks-yellow)]/40",
} as const;

const sizeClasses = {
  sm: "min-h-9 px-3 py-1.5 text-xs shadow-[3px_3px_0_0_var(--mks-ink)]",
  md: "min-h-11 px-4 py-2.5 text-sm shadow-[4px_4px_0_0_var(--mks-ink)]",
  lg: "min-h-12 px-6 py-3 text-base shadow-[6px_6px_0_0_var(--mks-ink)]",
} as const;

type Variant = keyof typeof variantClasses;
type Size = keyof typeof sizeClasses;

type ClassOptions = {
  variant?: Variant;
  size?: Size;
  className?: string;
  uppercase?: boolean;
};

export function mksButtonClass({
  variant = "primary",
  size = "md",
  className,
  uppercase = true,
}: ClassOptions = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-xl border-4 font-black transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
    uppercase && "uppercase tracking-wide",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type LinkProps = ClassOptions & Omit<React.ComponentProps<typeof Link>, "className">;

export function MksButtonLink({ variant, size, className, uppercase, ...props }: LinkProps) {
  return (
    <Link
      className={mksButtonClass({ variant, size, className, uppercase })}
      {...props}
    />
  );
}

export { variantClasses as mksButtonVariants, sizeClasses as mksButtonSizes };
