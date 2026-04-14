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
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        "transition-shadow duration-300 hover:shadow-md",
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
