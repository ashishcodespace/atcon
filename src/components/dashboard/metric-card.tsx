"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import clsx from "clsx";

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  href: string;
  tone?: "default" | "danger";
};

export function MetricCard({ label, value, hint, href, tone = "default" }: MetricCardProps) {
  return (
    <Link href={href}>
      <Card
        className={clsx(
          "h-full transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-18px_rgba(15,23,42,0.4)]",
          tone === "danger" && "border-rose-200 bg-rose-50/40",
        )}
      >
        <CardHeader className="flex items-center justify-between pb-1">
          <CardTitle>{label}</CardTitle>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
