import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "subtle";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-[0_8px_20px_-12px_rgba(20,184,166,0.8)] hover:from-teal-600 hover:to-emerald-600",
  ghost: "bg-transparent text-slate-700 hover:bg-white/70",
  subtle: "bg-white/70 text-slate-700 backdrop-blur-sm hover:bg-white",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
