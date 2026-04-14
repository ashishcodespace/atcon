import { Card, CardContent } from "@/components/ui/card";

type StatItem = {
  label: string;
  value: string;
  hint?: string;
  valueTone?: "default" | "success" | "warning" | "danger"; // Kept for backwards compatibility if passed, but ignored in styling.
};

export function StatStrip({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-wrap">
      {stats.map((stat) => (
        <Card key={stat.label} className="rounded-xl">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="text-3xl font-semibold leading-none text-slate-900">{stat.value}</p>
            {stat.hint ? <p className="text-xs text-slate-500">{stat.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
