"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useShallow } from "zustand/react/shallow";
import { useSyncExternalStore } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";
import { formatCurrency } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";

export default function ReportsPage() {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const { projects, timeLogs, clients, invoices } = useOpsStore(
    useShallow((state) => ({
      projects: state.projects,
      timeLogs: state.timeLogs,
      clients: state.clients,
      invoices: state.invoices,
    })),
  );

  const profitabilityRows = projects.map((project) => {
    const client = clients.find((item) => item.id === project.clientId);
    const logs = timeLogs.filter((log) => log.projectId === project.id && log.billable);
    const billedHours = logs.reduce((sum, log) => sum + log.hours, 0);
    const recognized = invoices
      .filter((invoice) => invoice.projectId === project.id && invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const costBase = billedHours * 85;
    const margin = recognized - costBase;
    return {
      id: project.id,
      projectName: project.name,
      clientName: client?.name ?? "Unknown",
      recognized,
      costBase,
      margin,
    };
  });

  const utilizationPie = [
    { name: "Billable", value: timeLogs.filter((log) => log.billable).reduce((sum, log) => sum + log.hours, 0), color: "#334155" },
    { name: "Non-billable", value: timeLogs.filter((log) => !log.billable).reduce((sum, log) => sum + log.hours, 0) || 4, color: "#cbd5e1" },
  ];
  const profitTotal = profitabilityRows.reduce((sum, row) => sum + row.margin, 0);
  const recognizedTotal = profitabilityRows.reduce((sum, row) => sum + row.recognized, 0);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
      </div>
      <StatStrip
        stats={[
          { label: "Recognized Revenue", value: formatCurrency(recognizedTotal), valueTone: "success" },
          { label: "Profitability", value: formatCurrency(profitTotal), valueTone: profitTotal > 0 ? "success" : "danger" },
          { label: "Billable Hours", value: `${utilizationPie[0].value}h` },
          { label: "Utilization Mix", value: `${Math.round((utilizationPie[0].value / (utilizationPie[0].value + utilizationPie[1].value)) * 100)}%`, valueTone: "warning" },
        ]}
      />
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Project Profitability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profitabilityRows.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{row.projectName}</p>
                    <p className="text-xs text-slate-500">{row.clientName}</p>
                  </div>
                  <p className={`text-sm font-semibold ${row.margin < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {formatCurrency(row.margin)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Revenue {formatCurrency(row.recognized)} · Cost base {formatCurrency(row.costBase)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>Utilization Split</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={utilizationPie} cx="50%" cy="50%" dataKey="value" outerRadius={95}>
                    {utilizationPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
