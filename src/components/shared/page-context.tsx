import { ReactNode } from "react";
import clsx from "clsx";

type Chip = {
  label: string;
  active?: boolean;
};

type PageContextProps = {
  breadcrumb: string[];
  chipLabel?: string;
  chips?: Chip[];
  rightChips?: Chip[];
  rightSlot?: ReactNode;
};

export function PageContext({ breadcrumb, chipLabel, chips = [], rightChips = [], rightSlot }: PageContextProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">{breadcrumb.join("  >  ")}</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          {chipLabel ? <span className="text-xs text-slate-500">{chipLabel}:</span> : null}
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={clsx(
                "whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium",
                chip.active
                  ? "border-emerald-400 bg-emerald-500 text-white"
                  : "border-white/50 bg-white/70 text-slate-600 backdrop-blur-sm",
              )}
            >
              {chip.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {rightChips.length > 0 ? (
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
              {rightChips.map((chip) => (
                <span
                  key={chip.label}
                  className={clsx(
                    "whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium",
                    chip.active
                      ? "border-sky-400 bg-sky-500 text-white"
                      : "border-white/50 bg-white/70 text-slate-600 backdrop-blur-sm",
                  )}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
          {rightSlot}
        </div>
      </div>
    </div>
  );
}
