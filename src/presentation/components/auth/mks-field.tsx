import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function MksField({ id, label, error, children, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="block text-xs font-black uppercase tracking-[0.15em] text-[var(--mks-ink)]"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm font-bold text-[var(--mks-pink)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function MksInput({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border-4 border-[var(--mks-ink)] bg-white px-4 py-3 text-[var(--mks-ink)] shadow-[4px_4px_0_0_var(--mks-cyan)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--mks-pink)] focus:shadow-[4px_4px_0_0_var(--mks-pink)]",
        invalid && "border-[var(--mks-pink)] shadow-[4px_4px_0_0_var(--mks-pink)]",
        className,
      )}
      {...props}
    />
  );
}
