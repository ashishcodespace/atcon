"use client";

import Link from "next/link";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useShallow } from "zustand/react/shallow";
import { useMemo, useSyncExternalStore, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [clientFilter, setClientFilter] = useState("all");
  const [costPerHour, setCostPerHour] = useState(85);

  const visibleProjects = useMemo(
    () => projects.filter((project) => (clientFilter === "all" ? true : project.clientId === clientFilter)),
    [projects, clientFilter],
  );

  const profitabilityRows = useMemo(
    () =>
      visibleProjects.map((project) => {
        const client = clients.find((item) => item.id === project.clientId);
        const logs = timeLogs.filter((log) => log.projectId === project.id && log.billable);
        const billedHours = logs.reduce((sum, log) => sum + log.hours, 0);
        const recognized = invoices
          .filter((invoice) => invoice.projectId === project.id && invoice.status === "paid")
          .reduce((sum, invoice) => sum + invoice.amount, 0);
        const costBase = billedHours * costPerHour;
        const margin = recognized - costBase;
        return {
          id: project.id,
          projectName: project.name,
          clientId: project.clientId,
          clientName: client?.name ?? "Unknown",
          recognized,
          costBase,
          margin,
        };
      }),
    [visibleProjects, clients, timeLogs, invoices, costPerHour],
  );

  const visibleProjectIds = new Set(visibleProjects.map((project) => project.id));
  const filteredLogs = timeLogs.filter((log) => visibleProjectIds.has(log.projectId));
  const billableHours = filteredLogs.filter((log) => log.billable).reduce((sum, log) => sum + log.hours, 0);
  const nonBillableHours = filteredLogs.filter((log) => !log.billable).reduce((sum, log) => sum + log.hours, 0);
  const totalTrackedHours = billableHours + nonBillableHours;
  const utilizationPie = [
    { name: "Billable", value: billableHours, color: "#334155" },
    { name: "Non-billable", value: nonBillableHours, color: "#cbd5e1" },
  ];
  const profitTotal = profitabilityRows.reduce((sum, row) => sum + row.margin, 0);
  const recognizedTotal = profitabilityRows.reduce((sum, row) => sum + row.recognized, 0);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
      </div>
      <div className="flex flex-row items-center justify-between gap-3 bg-transparent">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">Client</span>
          <select
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            className="rounded-lg border border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none w-auto max-w-[120px] sm:max-w-none text-ellipsis"
          >
            <option value="all">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">What-if cost</span>
          {[75, 85, 95].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCostPerHour(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${value === costPerHour ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
            >
              {formatCurrency(value)}/h
            </button>
          ))}
        </div>
      </div>
      <StatStrip
        stats={[
          { label: "Recognized Revenue", value: formatCurrency(recognizedTotal), valueTone: "success" },
          { label: "Profitability", value: formatCurrency(profitTotal), valueTone: profitTotal > 0 ? "success" : "danger" },
          { label: "Billable Hours", value: `${utilizationPie[0].value}h` },
          {
            label: "Utilization Mix",
            value: `${totalTrackedHours ? Math.round((billableHours / totalTrackedHours) * 100) : 0}%`,
            valueTone: "warning",
          },
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
                    <Link href={`/clients/${row.clientId}`} className="text-sm font-medium text-slate-800 hover:underline">
                      {row.projectName}
                    </Link>
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
            {profitabilityRows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">No report data for selected filters.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-5">
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
