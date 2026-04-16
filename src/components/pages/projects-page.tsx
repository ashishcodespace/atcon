"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AlertCircle, AlertTriangle, CalendarDays, ChevronDown, Filter, KanbanSquare, LayoutList, Plus, Search, Sparkles, X } from "lucide-react";
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
  managerId: string;
  description: string;
};

const INTERNAL_COST_PER_HOUR = 85;

export function ProjectsPageClient({ filter }: { filter?: string }) {
  const initialStatusFilter: StatusFilter = filter === "at-risk" ? "at_risk" : filter === "active" ? "active" : "all";

  const [view, setView] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatusFilter);
  const [clientFilter, setClientFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileViewSwitcher, setShowMobileViewSwitcher] = useState(false);
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
    managerId: users[0]?.id ?? "",
    description: "",
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
      managerId: form.managerId,
      description: form.description.trim(),
    });

    setShowCreateModal(false);
    setForm({
      name: "",
      clientId: clients[0]?.id ?? "",
      budget: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      managerId: users[0]?.id ?? "",
      description: "",
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
      <div className="flex flex-row items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-[-0.03em] shrink-0">Projects</h1>

          {/* Desktop-Only Search and Filters in Header */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search portfolio..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative shrink-0 ml-auto">
          {/* Desktop View Switcher */}
          <div className="hidden sm:inline-flex items-center rounded-xl bg-white p-1 border border-slate-200/60 shadow-sm">
            <button
              type="button"
              className={clsx(
                "p-2 rounded-lg transition-all cursor-pointer",
                view === "list" ? "text-slate-900 bg-slate-50 font-bold" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => setView("list")}
              title="List View"
            >
              <LayoutList className="h-5 w-5" />
            </button>
            <button
              type="button"
              className={clsx(
                "p-2 rounded-lg transition-all cursor-pointer",
                view === "board" ? "text-slate-900 bg-slate-50 font-bold" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => setView("board")}
              title="Board View"
            >
              <KanbanSquare className="h-5 w-5" />
            </button>
            <button
              type="button"
              className={clsx(
                "p-2 rounded-lg transition-all cursor-pointer",
                view === "timeline" ? "text-slate-900 bg-slate-50 font-bold" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => setView("timeline")}
              title="Timeline View"
            >
              <CalendarDays className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile View Toggle */}
          <button
            type="button"
            className={clsx(
              "p-2.5 flex sm:hidden items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all cursor-pointer",
              showMobileViewSwitcher ? "text-slate-900 bg-slate-50 border-slate-300" : "text-slate-500"
            )}
            onClick={() => setShowMobileViewSwitcher(!showMobileViewSwitcher)}
            title="Switch View"
          >
            {view === "list" && <LayoutList className="h-5 w-5" />}
            {view === "board" && <KanbanSquare className="h-5 w-5" />}
            {view === "timeline" && <CalendarDays className="h-5 w-5" />}
          </button>

          {/* Desktop Filters Button */}
          <Button
            variant="subtle"
            className={clsx(
              "!hidden lg:!flex items-center gap-2 h-11 px-4 cursor-pointer border border-slate-200 transition-all",
              showFilters ? "text-slate-900 bg-slate-50 border-slate-300" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            <span className="font-bold">Filters</span>
          </Button>

          {/* Mobile Filter Button */}
          <button
            type="button"
            className={clsx(
              "!flex lg:!hidden items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm transition-all cursor-pointer",
              showFilters ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-slate-500"
            )}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle Filters"
          >
            <Filter className="h-5 w-5" />
          </button>

          <Button
            variant="primary"
            className="gap-2 px-3 sm:px-6 h-11 cursor-pointer font-semibold tracking-tight shadow-md hover:shadow-lg transition-all"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="hidden sm:inline">New Project</span>
          </Button>

          {/* Unified Absolute Filter Dropdown */}
          {showFilters && (
            <div className="absolute right-0 top-full mt-2 z-[60] w-64 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="w-full appearance-none cursor-pointer rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100 transition-colors"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="delayed">Delayed</option>
                    <option value="completed">Completed</option>
                    <option value="at_risk">At risk</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</p>
                <div className="relative">
                  <select
                    value={clientFilter}
                    onChange={(event) => setClientFilter(event.target.value)}
                    className="w-full appearance-none cursor-pointer rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100 transition-colors"
                  >
                    <option value="all">All Clients</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full h-9 text-xs font-bold text-slate-500 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setClientFilter("all");
                  setShowFilters(false);
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}

          {/* ... View switcher logic below ... */}

          {/* Mobile Vertical View Switcher Dropdown (Absolute) */}
          {showMobileViewSwitcher && (
            <div className="absolute right-0 top-full mt-2 z-[60] w-44 flex flex-col gap-1 sm:hidden rounded-xl border border-slate-100 bg-white p-1 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => { setView("list"); setShowMobileViewSwitcher(false); }}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer",
                  view === "list" ? "text-slate-900 bg-slate-50 font-bold" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <LayoutList className="h-4 w-4" /> List View
              </button>
              <button
                onClick={() => { setView("board"); setShowMobileViewSwitcher(false); }}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer",
                  view === "board" ? "text-slate-900 bg-slate-50 font-bold" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <KanbanSquare className="h-4 w-4" /> Board View
              </button>
              <button
                onClick={() => { setView("timeline"); setShowMobileViewSwitcher(false); }}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer",
                  view === "timeline" ? "text-slate-900 bg-slate-50 font-bold" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <CalendarDays className="h-4 w-4" /> Timeline View
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar - Hidden on Mobile */}
      <div className="hidden lg:flex flex-col gap-3">
        {/* The desktop search is now handled in the top row. 
            On mobile, we are removing search entirely from the main flow. 
        */}
      </div>

      <StatStrip
        stats={[
          { label: "Total Projects", value: String(filteredProjects.length) },
          { label: "In Flight", value: String(active.length), hint: "Currently executing" },
          { label: "Needs Attention", value: String(atRiskCount), hint: `${delayed.length} delayed` },
          { label: "Avg Progress", value: `${avgProgress}%`, hint: `${overdueTimelineCount} timeline overruns` },
          { label: "Total Budget", value: formatCurrency(totalBudget) },
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
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white">
              <table className="min-w-[980px] w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Project</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400 text-left">Timeline</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400 text-left">Delivery</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400 text-left">Budget Health</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400 text-left">Team Load</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400 text-left lg:text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-sm text-slate-500 text-center" colSpan={6}>
                        No projects match your portfolio filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 tracking-tight">{project.name}</p>
                          <p className="text-sm text-slate-400 mt-0.5 font-medium leading-none">{project.clientName}</p>
                          <div className="mt-2.5 flex items-center gap-1.5">
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
                            <Badge label={`Risk ${project.riskScore}`} tone="neutral" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700 font-medium">
                            {formatDate(project.startDate)} - {formatDate(project.endDate)}
                          </p>
                          <p className={clsx("text-sm mt-1 font-medium flex items-center gap-1", project.daysLeft < 0 ? "text-rose-900" : "text-slate-400")}>
                            {project.daysLeft < 0 && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
                            {project.daysLeft < 0 ? `${Math.abs(project.daysLeft)}d overdue` : `${project.daysLeft}d remaining`}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-between gap-2 max-w-[140px] mb-1.5">
                            <p className="text-sm font-semibold text-slate-700">{project.progress}%</p>
                            <p className="text-xs font-bold text-slate-300 uppercase">Progress</p>
                          </div>
                          <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${project.progress}%` }} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-base font-bold text-slate-800">{formatCurrency(project.estimatedSpend)}</p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 leading-none">
                            <span className="font-medium text-slate-500">{formatCurrency(project.budget)}</span>
                            <span>·</span>
                            <span className={clsx("font-bold flex items-center gap-1", project.burnRate > 80 ? "text-rose-950" : "text-emerald-950")}>
                              {project.burnRate > 80 && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
                              {project.burnRate}% burn
                            </span>
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="text-slate-700 font-semibold">{project.leadName}</p>
                          <p className="text-sm text-slate-400 mt-1">
                            <span className="text-slate-600 font-medium">{project.openCount}</span> open · <span className="text-slate-300">{project.blockedCount} blocked</span>
                          </p>
                        </td>
                        <td className="px-6 py-4 text-left lg:text-right">
                          <Link href={`/clients/${project.clientId}`} className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                            Open Dashboard
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
            {timelineProjects.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                No projects in this timeline scope.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl animate-in fade-in zoom-in duration-200">
            <form onSubmit={handleCreateProject} className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create New Project</h2>
                  <p className="text-sm text-slate-500">Set up project details and team</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
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
              <label className="block text-sm text-slate-600">
                Project Manager
                <div className="relative mt-1">
                  <select
                    value={form.managerId}
                    onChange={(event) => setForm((prev) => ({ ...prev, managerId: event.target.value }))}
                    className="appearance-none w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 shadow-sm"
                    required
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </label>
              <label className="block text-sm text-slate-600">
                Project Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 min-h-[80px]"
                  placeholder="What is this project about? Goals, key deliveries..."
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-600">
                  Client
                  <div className="relative mt-1">
                    <select
                      value={form.clientId}
                      onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
                      className="appearance-none w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 shadow-sm"
                      required
                    >
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
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
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
