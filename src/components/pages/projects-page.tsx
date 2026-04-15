"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AlertTriangle, CalendarDays, KanbanSquare, LayoutList, Plus, Search, Sparkles } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getProjectRiskScore } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";
import { ProjectStatus } from "@/types/domain";

type ViewMode = "list" | "board" | "timeline";
type StatusFilter = "all" | "active" | "delayed" | "completed" | "at_risk";

type ProjectForm = {
  name: string;
  clientId: string;
  budget: string;
  startDate: string;
  endDate: string;
};

const INTERNAL_COST_PER_HOUR = 85;

export function ProjectsPageClient({ filter }: { filter?: string }) {
  const initialStatusFilter: StatusFilter = filter === "at-risk" ? "at_risk" : filter === "active" ? "active" : "all";
  const [view, setView] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatusFilter);
  const [clientFilter, setClientFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [todayTs] = useState(() => Date.now());

  const { projects, clients, tasks, invoices, users, timeLogs, addProject } = useOpsStore(
    useShallow((state) => ({
      projects: state.projects,
      clients: state.clients,
      tasks: state.tasks,
      invoices: state.invoices,
      users: state.users,
      timeLogs: state.timeLogs,
      addProject: state.addProject,
    })),
  );

  const [form, setForm] = useState<ProjectForm>({
    name: "",
    clientId: clients[0]?.id ?? "",
    budget: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  });

  const enrichedProjects = useMemo(() => {
    return projects.map((project) => {
      const client = clients.find((item) => item.id === project.clientId);
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const doneCount = projectTasks.filter((task) => task.status === "done").length;
      const blockedCount = projectTasks.filter((task) => task.status === "blocked").length;
      const openCount = projectTasks.filter((task) => task.status !== "done").length;
      const riskScore = getProjectRiskScore(project, tasks, invoices);
      const timeSpentHours = timeLogs
        .filter((log) => log.projectId === project.id)
        .reduce((sum, log) => sum + log.hours, 0);
      const estimatedSpend = Math.round(timeSpentHours * INTERNAL_COST_PER_HOUR);
      const burnRate = project.budget > 0 ? Math.round((estimatedSpend / project.budget) * 100) : 0;
      const assigneeCountMap: Record<string, number> = {};
      for (const task of projectTasks) {
        assigneeCountMap[task.assigneeId] = (assigneeCountMap[task.assigneeId] ?? 0) + 1;
      }
      const leadAssigneeId = Object.entries(assigneeCountMap).sort((a, b) => b[1] - a[1])[0]?.[0];
      const lead = users.find((user) => user.id === leadAssigneeId);
      const daysLeft = Math.ceil((new Date(project.endDate).getTime() - todayTs) / (1000 * 60 * 60 * 24));

      return {
        ...project,
        clientName: client?.name ?? "Unknown",
        taskCount: projectTasks.length,
        completionRate: projectTasks.length ? Math.round((doneCount / projectTasks.length) * 100) : 0,
        riskScore,
        blockedCount,
        openCount,
        leadName: lead?.name ?? "Unassigned",
        timeSpentHours,
        estimatedSpend,
        burnRate,
        daysLeft,
      };
    });
  }, [projects, clients, tasks, invoices, users, timeLogs, todayTs]);

  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter((project) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClient = clientFilter === "all" || project.clientId === clientFilter;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "at_risk"
            ? project.riskScore >= 4
            : project.status === statusFilter;
      return matchesSearch && matchesClient && matchesStatus;
    });
  }, [enrichedProjects, searchQuery, clientFilter, statusFilter]);

  const delayed = filteredProjects.filter((project) => project.status === "delayed");
  const active = filteredProjects.filter((project) => project.status === "active");
  const completed = filteredProjects.filter((project) => project.status === "completed");
  const totalBudget = filteredProjects.reduce((sum, project) => sum + project.budget, 0);
  const totalSpend = filteredProjects.reduce((sum, project) => sum + project.estimatedSpend, 0);
  const atRiskCount = filteredProjects.filter((project) => project.riskScore >= 4).length;
  const avgProgress = filteredProjects.length
    ? Math.round(filteredProjects.reduce((sum, project) => sum + project.progress, 0) / filteredProjects.length)
    : 0;
  const overdueTimelineCount = filteredProjects.filter((project) => project.daysLeft < 0 && project.status !== "completed").length;

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const budget = Number(form.budget);
    if (!form.name.trim() || !form.clientId || !form.startDate || !form.endDate || !Number.isFinite(budget) || budget <= 0) {
      return;
    }

    addProject({
      name: form.name.trim(),
      clientId: form.clientId,
      status: "active",
      budget,
      progress: 0,
      startDate: form.startDate,
      endDate: form.endDate,
    });

    setShowCreateModal(false);
    setForm({
      name: "",
      clientId: clients[0]?.id ?? "",
      budget: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    });
  };

  const boardColumns = [
    {
      label: "Needs Attention",
      tone: "warning" as const,
      projects: filteredProjects.filter((project) => project.status === "delayed" || project.riskScore >= 4),
    },
    {
      label: "In Flight",
      tone: "info" as const,
      projects: filteredProjects.filter((project) => project.status === "active" && project.riskScore < 4),
    },
    {
      label: "Completed",
      tone: "success" as const,
      projects: completed,
    },
  ];

  const timelineProjects = [...filteredProjects].sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate));

  const statusLabelMap: Record<ProjectStatus, string> = {
    active: "Active",
    delayed: "Delayed",
    completed: "Completed",
  };

  return (
    <section className="space-y-4">
      <PageContext
        breadcrumb={["Internal Hub", "Projects"]}
        chipLabel="Projects Screens"
        chips={[
          { label: "PR-01 Smart Portfolio", active: true },
          { label: "PR-02 Delivery Board" },
          { label: "PR-03 Timeline Radar" },
          { label: "PR-04 Project Setup" },
        ]}
        rightChips={[
          { label: "PR-05 Billing Linkage" },
          { label: "PR-06 Risk Signals" },
          { label: "PR-07 Team Capacity" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Run delivery like a CRM pipeline with clearer accountability and faster decisions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "list" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700",
              )}
              onClick={() => setView("list")}
            >
              <span className="inline-flex items-center gap-1">
                <LayoutList className="h-3.5 w-3.5" />
                List
              </span>
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "board" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700",
              )}
              onClick={() => setView("board")}
            >
              <span className="inline-flex items-center gap-1">
                <KanbanSquare className="h-3.5 w-3.5" />
                Board
              </span>
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "timeline" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700",
              )}
              onClick={() => setView("timeline")}
            >
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Timeline
              </span>
            </button>
          </div>
          <Button variant="primary" className="gap-1" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-4">
          <div className="flex min-w-[230px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find a project or client"
              className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
            <option value="at_risk">At risk</option>
          </select>

          <select
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            className="text-xs"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setClientFilter("all");
            }}
          >
            Reset filters
          </Button>
        </CardContent>
      </Card>

      <StatStrip
        stats={[
          { label: "Total Projects", value: String(filteredProjects.length) },
          { label: "In Flight", value: String(active.length), hint: "Currently executing" },
          { label: "Needs Attention", value: String(atRiskCount), hint: `${delayed.length} delayed` },
          { label: "Avg Progress", value: `${avgProgress}%`, hint: `${overdueTimelineCount} timeline overruns` },
          { label: "Total Budget", value: formatCurrency(totalBudget), valueTone: "success" },
          { label: "Est. Spend", value: formatCurrency(totalSpend), hint: "From logged effort" },
        ]}
      />

      {view === "list" && (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Project Portfolio Overview</CardTitle>
            <Badge label={`${filteredProjects.length} visible`} tone="neutral" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[980px] w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Project</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Timeline</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Delivery</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Budget Health</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Team Load</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-sm text-slate-500" colSpan={6}>
                        No projects match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="border-t border-slate-100 text-sm text-slate-700">
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-800">{project.name}</p>
                          <p className="text-xs text-slate-500">{project.clientName}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge
                              label={statusLabelMap[project.status]}
                              tone={
                                project.status === "delayed"
                                  ? "danger"
                                  : project.status === "completed"
                                    ? "success"
                                    : "info"
                              }
                            />
                            <Badge label={`Risk ${project.riskScore}`} tone={project.riskScore >= 4 ? "warning" : "neutral"} />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p>{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
                          <p className={clsx("text-xs", project.daysLeft < 0 ? "text-rose-600" : "text-slate-500")}>
                            {project.daysLeft < 0 ? `${Math.abs(project.daysLeft)}d overdue` : `${project.daysLeft}d left`}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-xs text-slate-500">{project.progress}% overall progress</p>
                          <div className="mt-1 h-2 w-36 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-800">{formatCurrency(project.estimatedSpend)}</p>
                          <p className="text-xs text-slate-500">
                            {formatCurrency(project.budget)} budget · {project.burnRate}% burn
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-xs text-slate-500">{project.leadName}</p>
                          <p className="text-xs text-slate-500">{project.openCount} open · {project.blockedCount} blocked</p>
                        </td>
                        <td className="px-3 py-3">
                          <Link href={`/clients/${project.clientId}`} className="text-xs font-medium text-slate-700 hover:text-slate-900">
                            Open client
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {view === "board" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {boardColumns.map((column) => (
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
                      <Badge label={`${project.progress}% progress`} tone="neutral" />
                      <Badge label={`Risk ${project.riskScore}`} tone={project.riskScore >= 4 ? "warning" : "neutral"} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {project.openCount} open tasks · {project.daysLeft < 0 ? `${Math.abs(project.daysLeft)}d overdue` : `${project.daysLeft}d left`}
                    </p>
                  </div>
                ))}
                {column.projects.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                    No projects in this stage.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {view === "timeline" && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Timeline Radar</CardTitle>
            <Badge label={`${timelineProjects.length} milestones`} tone="info" />
          </CardHeader>
          <CardContent className="space-y-2">
            {timelineProjects.map((project) => (
              <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{project.name}</p>
                  <p className="text-xs text-slate-500">{project.clientName}</p>
                </div>
                <div className="text-sm text-slate-600">{formatDate(project.startDate)} - {formatDate(project.endDate)}</div>
                <div className="flex items-center gap-2">
                  <Badge label={`${project.progress}% done`} tone="neutral" />
                  <Badge label={project.daysLeft < 0 ? "Overdue" : "On timeline"} tone={project.daysLeft < 0 ? "danger" : "success"} />
                </div>
              </div>
            ))}
            {timelineProjects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                No projects in this timeline scope.
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Efficiency Recommendations
          </CardTitle>
          <Badge label="Auto insights" tone="success" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Prioritize projects with high burn rate and low progress to reduce margin leakage early.
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Keep a weekly owner check-in on delayed projects so blockers can be reassigned quickly.
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Use timeline view during planning calls to prevent due-date collisions across client accounts.
          </p>
          {atRiskCount > 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-4 w-4" />
                {atRiskCount} projects need attention this week.
              </span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Create New Project</h2>
              <p className="text-sm text-slate-500">Capture basic setup now, enrich details later from the client page.</p>
            </div>
            <form className="space-y-3 px-5 py-4" onSubmit={handleCreateProject}>
              <label className="block text-sm text-slate-600">
                Project title
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="Example: Website Revamp Sprint"
                  required
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-600">
                  Client
                  <select
                    value={form.clientId}
                    onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-600">
                  Budget
                  <input
                    type="number"
                    min={1}
                    step={100}
                    value={form.budget}
                    onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="50000"
                    required
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-600">
                  Start date
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  />
                </label>
                <label className="block text-sm text-slate-600">
                  End date
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
