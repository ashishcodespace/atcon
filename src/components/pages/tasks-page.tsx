"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";
import { TaskStatus } from "@/types/domain";
import { useShallow } from "zustand/react/shallow";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

export function TasksPageClient({ filter }: { filter?: string }) {
  const { tasks, projects, users, updateTaskStatus, reassignTask } = useOpsStore(
    useShallow((state) => ({
      tasks: state.tasks,
      projects: state.projects,
      users: state.users,
      updateTaskStatus: state.updateTaskStatus,
      reassignTask: state.reassignTask,
    })),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "my" | "blocked" | "overdue">(filter === "due" ? "overdue" : "all");

  const rows = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        projectName: projects.find((project) => project.id === task.projectId)?.name ?? "Unknown",
        assigneeName: users.find((user) => user.id === task.assigneeId)?.name ?? "Unassigned",
      })),
    [tasks, projects, users],
  );
  const currentUserId = users[1]?.id ?? users[0]?.id;
  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return rows.filter((task) => {
      if (filter === "due" && task.status === "done") return false;
      if (viewFilter === "my" && task.assigneeId !== currentUserId) return false;
      if (viewFilter === "blocked" && task.status !== "blocked") return false;
      if (viewFilter === "overdue" && (task.status === "done" || task.dueDate >= TODAY_ISO)) return false;
      if (!normalizedQuery) return true;
      return (
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.projectName.toLowerCase().includes(normalizedQuery) ||
        task.assigneeName.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [rows, filter, viewFilter, currentUserId, searchQuery]);
  const openCount = filteredRows.filter((task) => task.status === "todo").length;
  const progressCount = filteredRows.filter((task) => task.status === "in_progress").length;
  const blockedCount = filteredRows.filter((task) => task.status === "blocked").length;
  const overdueCount = filteredRows.filter((task) => task.status !== "done" && task.dueDate < TODAY_ISO).length;
  const avgResponse = filteredRows.length
    ? `${(filteredRows.reduce((sum, task) => sum + task.estimatedHours, 0) / filteredRows.length).toFixed(1)}h`
    : "0.0h";

  const statusOptions: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

  return (
    <section className="h-full min-h-0 overflow-y-auto pr-1">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-[-0.03em]">Tasks</h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks, projects, assignees..."
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">View</span>
            <select
              value={viewFilter}
              onChange={(event) => setViewFilter(event.target.value as typeof viewFilter)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none"
            >
              <option value="all">All</option>
              <option value="my">My tasks</option>
              <option value="blocked">Blocked</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <StatStrip
          stats={[
            { label: "Open", value: String(openCount), hint: "Awaiting start" },
            { label: "In Progress", value: String(progressCount), hint: "Active development" },
            { label: "Blocked", value: String(blockedCount), hint: "Needs attention" },
            { label: "Overdue", value: String(overdueCount), hint: "Missed due date" },
            { label: "Avg Effort", value: avgResponse, hint: "Per visible task" },
          ]}
        />

        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Active Task Operations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              rows={filteredRows}
              minWidth="1000px"
              columns={[
                {
                  key: "task",
                  title: "Task Description",
                  render: (task) => (
                    <div className="max-w-[400px]">
                      <p className="font-bold text-slate-800 tracking-tight leading-none">{task.title}</p>
                      <p className="text-sm text-slate-400 mt-1 font-medium leading-none">{task.projectName}</p>
                    </div>
                  ),
                },
                { 
                  key: "assignee", 
                  title: "Assignee", 
                  render: (task) => (
                    <select
                      value={task.assigneeId}
                      onChange={(event) => reassignTask(task.id, event.target.value)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  )
                },
                {
                  key: "status",
                  title: "Status",
                  className: "text-center w-[160px] whitespace-nowrap",
                  render: (task) => (
                    <div className="flex justify-center">
                      <select
                        value={task.status}
                        onChange={(event) => updateTaskStatus(task.id, event.target.value as TaskStatus)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  ),
                },
                { 
                  key: "priority", 
                  title: "Priority", 
                  className: "text-center whitespace-nowrap w-[120px]",
                  render: (task) => (
                    <div className="flex justify-center">
                      <Badge label={task.priority.toUpperCase()} tone="neutral" />
                    </div>
                  )
                },
                { 
                  key: "due", 
                  title: "Due Date", 
                  className: "text-center whitespace-nowrap w-[120px]",
                  render: (task) => (
                    <p className="text-sm font-medium text-slate-600 tracking-tight">{formatDate(task.dueDate)}</p>
                  )
                },
                {
                  key: "actions",
                  title: "Due Health",
                  className: "text-left whitespace-nowrap",
                  render: (task) => (
                    <Badge
                      label={task.status === "done" ? "Closed" : task.dueDate < TODAY_ISO ? "Overdue" : "On track"}
                      tone={task.status === "done" ? "success" : task.dueDate < TODAY_ISO ? "danger" : "neutral"}
                    />
                  ),
                },
              ]}
              emptyMessage="No tasks match your current view."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
