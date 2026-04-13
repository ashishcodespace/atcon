import { Card, CardContent } from "@/components/ui/card";

type StatItem = {
  label: string;
  value: string;
  hint?: string;
  valueTone?: "default" | "success" | "warning" | "danger";
};

const toneClasses = {
  default: "text-slate-900",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
};

export function StatStrip({ stats }: { stats: StatItem[] }) {
  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((stat) => (
        <Card key={stat.label} className="rounded-xl">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-semibold leading-none ${toneClasses[stat.valueTone ?? "default"]}`}>{stat.value}</p>
            {stat.hint ? <p className="text-xs text-slate-500">{stat.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
