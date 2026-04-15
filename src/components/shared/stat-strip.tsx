import { Card, CardContent } from "@/components/ui/card";

type StatItem = {
  label: string;
  value: string;
  hint?: string;
  valueTone?: "default" | "success" | "warning" | "danger"; // Kept for backwards compatibility if passed, but ignored in styling.
};

export function StatStrip({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 flex-wrap">
      {stats.map((stat) => (
        <Card key={stat.label} className="rounded-xl border-slate-200/50 shadow-sm">
          <CardContent 
            className="space-y-1.5 p-6"
            aria-label={`${stat.label}: ${stat.value}${stat.hint ? `. ${stat.hint}` : ""}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400" aria-hidden="true">{stat.label}</p>
            <p className="text-3xl font-semibold tracking-tighter leading-none text-slate-900" aria-hidden="true">{stat.value}</p>
            {stat.hint ? <p className="text-xs text-slate-500 font-medium" aria-hidden="true">{stat.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
