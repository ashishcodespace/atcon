"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Columns3, Download, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { DataTable } from "@/components/shared/data-table";
import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getProjectRiskScore } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";

type ViewMode = "list" | "kanban";

export function ProjectsPageClient({ filter }: { filter?: string }) {
  const [view, setView] = useState<ViewMode>("list");
  const { projects, clients, tasks, invoices } = useOpsStore(
    useShallow((state) => ({
      projects: state.projects,
      clients: state.clients,
      tasks: state.tasks,
      invoices: state.invoices,
    })),
  );

  const enrichedProjects = useMemo(() => {
    return projects.map((project) => {
      const client = clients.find((item) => item.id === project.clientId);
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const doneCount = projectTasks.filter((task) => task.status === "done").length;
      const riskScore = getProjectRiskScore(project, tasks, invoices);
      return {
        ...project,
        clientName: client?.name ?? "Unknown",
        taskCount: projectTasks.length,
        completionRate: projectTasks.length ? Math.round((doneCount / projectTasks.length) * 100) : 0,
        riskScore,
      };
    });
  }, [projects, clients, tasks, invoices]);

  const filteredProjects = enrichedProjects.filter((project) => {
    if (!filter || filter === "active") return project.status === "active";
    if (filter === "at-risk") return project.riskScore >= 4;
    return true;
  });

  const delayed = filteredProjects.filter((project) => project.status === "delayed");
  const active = filteredProjects.filter((project) => project.status === "active");
  const completed = filteredProjects.filter((project) => project.status === "completed");
  const totalBudget = filteredProjects.reduce((sum, project) => sum + project.budget, 0);
  const spentApprox = Math.round(totalBudget * 0.33);

  return (
    <section className="space-y-4">
      <PageContext
        breadcrumb={["Internal Hub", "Projects"]}
        chipLabel="Projects Screens"
        chips={[
          { label: "PR-01 Projects List", active: true },
          { label: "PR-02 Detail" },
          { label: "PR-03 Timesheets" },
          { label: "PR-04 Approvals" },
        ]}
        rightChips={[
          { label: "Client Portal" },
          { label: "Freelancer Portal" },
          { label: "PR-09 Approve/Reject" },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Track status, delivery risk, and timeline impact.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" className="gap-1">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
          <Button variant={view === "list" ? "primary" : "subtle"} onClick={() => setView("list")}>
            List
          </Button>
          <Button variant={view === "kanban" ? "primary" : "subtle"} onClick={() => setView("kanban")}>
            Kanban
          </Button>
        </div>
      </div>
      <StatStrip
        stats={[
          { label: "Total Projects", value: String(filteredProjects.length) },
          { label: "In Progress", value: String(active.length), valueTone: "success" },
          { label: "Delayed", value: String(delayed.length), valueTone: "danger" },
          { label: "Total Budget", value: formatCurrency(totalBudget), valueTone: "success" },
          { label: "Total Spent", value: formatCurrency(spentApprox), valueTone: "warning" },
        ]}
      />

      {view === "list" ? (
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Project Portfolio</CardTitle>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">
                <Search className="h-4 w-4" />
                Search...
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="gap-1.5 text-xs"><SlidersHorizontal className="h-3.5 w-3.5" />Filter</Button>
                <Button variant="ghost" className="gap-1.5 text-xs"><Columns3 className="h-3.5 w-3.5" />Columns</Button>
                <Button variant="ghost" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={filteredProjects}
              columns={[
                {
                  key: "name",
                  title: "Project",
                  render: (project) => (
                    <div>
                      <p className="font-medium text-slate-800">{project.name}</p>
                      <p className="text-xs text-slate-500">{project.clientName}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  title: "Status",
                  render: (project) => (
                    <Badge
                      label={project.status}
                      tone={
                        project.status === "delayed"
                          ? "danger"
                          : project.status === "completed"
                            ? "success"
                            : "info"
                      }
                    />
                  ),
                },
                { key: "timeline", title: "Timeline", render: (project) => `${formatDate(project.startDate)} - ${formatDate(project.endDate)}` },
                { key: "budget", title: "Budget", render: (project) => formatCurrency(project.budget) },
                { key: "tasks", title: "Tasks", render: (project) => `${project.completionRate}% done (${project.taskCount})` },
                {
                  key: "risk",
                  title: "Risk",
                  render: (project) => (
                    <Badge
                      label={`Score ${project.riskScore}`}
                      tone={project.riskScore >= 4 ? "warning" : "neutral"}
                    />
                  ),
                },
                {
                  key: "action",
                  title: "",
                  render: (project) => (
                    <Link
                      href={`/clients/${project.clientId}`}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Open client
                    </Link>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Delayed", projects: delayed, tone: "danger" as const },
            { label: "Active", projects: active, tone: "info" as const },
            { label: "Completed", projects: completed, tone: "success" as const },
          ].map((column) => (
            <Card key={column.label}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{column.label}</CardTitle>
                <Badge label={`${column.projects.length}`} tone={column.tone} />
              </CardHeader>
              <CardContent className="space-y-2">
                {column.projects.map((project) => (
                  <div key={project.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-800">{project.name}</p>
                    <p className="text-xs text-slate-500">{project.clientName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge label={`${project.completionRate}% done`} tone="neutral" />
                      <Badge label={`Risk ${project.riskScore}`} tone={project.riskScore >= 4 ? "warning" : "neutral"} />
                    </div>
                  </div>
                ))}
                {column.projects.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                    No projects in this lane.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
