import clsx from "clsx";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border border-slate-200 bg-white/70 text-slate-700 backdrop-blur-sm",
  success: "border border-emerald-200 bg-emerald-50/80 text-emerald-700",
  warning: "border border-amber-200 bg-amber-50/80 text-amber-700",
  danger: "border border-rose-200 bg-rose-50/80 text-rose-700",
  info: "border border-sky-200 bg-sky-50/80 text-sky-700",
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
