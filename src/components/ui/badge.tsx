import clsx from "clsx";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-slate-200/50 bg-slate-50 text-slate-500",
  success: "border-emerald-200/40 bg-emerald-50/50 text-emerald-600",
  warning: "border-amber-200/40 bg-amber-50/50 text-amber-600",
  danger: "border-rose-200/40 bg-rose-50/50 text-rose-600",
  info: "border-sky-200/40 bg-sky-50/50 text-sky-600",
};

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ label, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em]",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
