"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useShallow } from "zustand/react/shallow";
import { useSyncExternalStore } from "react";

import { DataTable } from "@/components/shared/data-table";
import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getDashboardMetrics, getOperationalInsights } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";

export default function DashboardPage() {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const data = useOpsStore(
    useShallow((state) => ({
      clients: state.clients,
      projects: state.projects,
      tasks: state.tasks,
      users: state.users,
      timeLogs: state.timeLogs,
      invoices: state.invoices,
    })),
  );

  const metrics = getDashboardMetrics(data);
  const insights = getOperationalInsights(data);

  const revenueTrend = [
    { month: "Jan", value: 32000 },
    { month: "Feb", value: 36500 },
    { month: "Mar", value: 40200 },
    { month: "Apr", value: 41800 },
    { month: "May", value: 45500 },
  ];

  const utilizationBars = data.users.map((user) => {
    const assignedHours = data.tasks
      .filter((task) => task.assigneeId === user.id && task.status !== "done")
      .reduce((sum, task) => sum + task.estimatedHours, 0);
    return {
      name: user.name.split(" ")[0],
      utilization: Math.round((assignedHours / user.capacityHours) * 100),
    };
  });

  const dueTasks = data.tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 5);

  return (
    <section className="h-full min-h-0 overflow-y-auto lg:overflow-hidden pr-1">
      <div className="flex flex-col lg:grid lg:h-full lg:min-h-0 lg:grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-4">
        {/* <PageContext
          breadcrumb={[]}
        chipLabel="Dashboard Screens"
        chips={[
          { label: "Overview", active: true },
          { label: "Delivery" },
          { label: "Revenue" },
          { label: "Team" },
        ]}
        rightChips={[
          { label: "Checklist", active: true },
          { label: "Board View" },
          { label: "Internal Hub" },
        ]}
        /> */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-[-0.03em]">Dashboard</h1>
          </div>
        </div>

        <div className="space-y-4">
          <StatStrip
            stats={[
              { label: "Active Portfolio", value: String(metrics.activeProjects), hint: "Delivery in motion" },
              { label: "Pending Invoices", value: String(metrics.pendingInvoices), hint: "Follow-up required" },
              { label: "Allocation", value: `${metrics.teamUtilization}%`, hint: "Capacity usage" },
              { label: "Urgent Tasks", value: String(metrics.tasksDue), hint: "Due soon" },
            ]}
          />
        </div>

        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-12 lg:grid-rows-2 gap-4">
          <Card className="col-span-1 lg:col-span-7 min-h-[350px] lg:min-h-0">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Revenue Trend + Forecast</CardTitle>
              <Badge label={`Forecast ${formatCurrency(insights.forecastRevenue)}`} tone="info" />
            </CardHeader>
            <CardContent className="h-[250px] w-full min-h-[250px] sm:h-[300px]">
              {isClient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#475569" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(typeof value === "number" ? value : Number(value ?? 0))
                      }
                    />
                    <Area type="monotone" dataKey="value" stroke="#334155" fill="url(#revFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-5 min-h-[350px] lg:min-h-0">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Team Capacity Risk</CardTitle>
              <Badge label={`${insights.overloadedUsers.length} overloaded`} tone={insights.overloadedUsers.length ? "danger" : "success"} />
            </CardHeader>
            <CardContent className="h-[250px] w-full min-h-[250px] sm:h-[300px]">
              {isClient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationBars}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) =>
                        `${typeof value === "number" ? value : Number(value ?? 0)}%`
                      }
                    />
                    <Bar dataKey="utilization" fill="#64748b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-7 min-h-[350px] lg:min-h-0 flex flex-col">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Alerts & Recommended Actions</CardTitle>
              <Badge label={`${insights.atRiskProjects.length} projects at risk`} tone={insights.atRiskProjects.length ? "warning" : "success"} />
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-2">
                {insights.atRiskProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-700" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{project.name}</p>
                        <p className="text-xs text-slate-500">Risk score {project.riskScore}: schedule and dependency pressure</p>
                      </div>
                    </div>
                    <Link href={`/projects?filter=at-risk`} className="text-xs font-medium text-slate-700 hover:text-slate-900">
                      Review
                    </Link>
                  </div>
                ))}
                {insights.overdueInvoices.slice(0, 2).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Invoice {invoice.id.toUpperCase()} overdue</p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(invoice.amount)} due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <Link href="/invoices?status=overdue" className="text-xs font-medium text-rose-700 hover:text-rose-800">
                      Send reminder
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-5 min-h-[350px] lg:min-h-0 flex flex-col">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Tasks Due</CardTitle>
              <Link href="/tasks?filter=due" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                Open task board
                <TrendingUp className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto">
              <DataTable
                rows={dueTasks}
                columns={[
                  { key: "title", title: "Task", render: (task) => task.title },
                  {
                    key: "due",
                    title: "Due",
                    render: (task) => (
                      <Badge label={formatDate(task.dueDate)} tone={new Date(task.dueDate) < new Date() ? "danger" : "neutral"} />
                    ),
                  },
                  { key: "priority", title: "Priority", render: (task) => task.priority.replace("_", " ") },
                ]}
                emptyMessage="No upcoming tasks."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
