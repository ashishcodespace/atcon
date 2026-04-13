import { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xl",
        "shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={clsx("px-4 py-3", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={clsx("text-sm font-semibold text-slate-700", className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={clsx("px-4 pb-4", className)}>{children}</div>;
}
