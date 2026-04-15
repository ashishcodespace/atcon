import { AlertCircle, AlertTriangle, CheckCircle2, Info, LucideIcon } from "lucide-react";
import clsx from "clsx";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneConfig: Record<BadgeTone, { classes: string; icon?: LucideIcon }> = {
  neutral: { 
    classes: "border-slate-200/50 bg-slate-50 text-slate-500",
  },
  success: { 
    classes: "border-emerald-200/40 bg-emerald-50/50 text-emerald-900",
    icon: CheckCircle2
  },
  warning: { 
    classes: "border-amber-200/40 bg-amber-50/50 text-amber-900",
    icon: AlertTriangle
  },
  danger: { 
    classes: "border-rose-200/40 bg-rose-50/50 text-rose-950",
    icon: AlertCircle
  },
  info: { 
    classes: "border-sky-200/40 bg-sky-50/50 text-sky-900",
    icon: Info
  },
};

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ label, tone = "neutral", className }: BadgeProps) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em]",
        config.classes,
        className,
      )}
      role="status"
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {label}
    </span>
  );
}
