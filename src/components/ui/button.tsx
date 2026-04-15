import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "subtle";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-[0.98]",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors",
  subtle: "bg-white text-slate-700 border border-slate-200/80 shadow-sm hover:bg-slate-50 transition-all",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold tracking-tight transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
