"use client";

import { Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";
import { useShallow } from "zustand/react/shallow";

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

  const rows = tasks
    .filter((task) => (filter === "due" ? task.status !== "done" : true))
    .map((task) => ({
      ...task,
      projectName: projects.find((project) => project.id === task.projectId)?.name ?? "Unknown",
      assigneeName: users.find((user) => user.id === task.assigneeId)?.name ?? "Unassigned",
    }));
  const openCount = rows.filter((task) => task.status === "todo").length;
  const progressCount = rows.filter((task) => task.status === "in_progress").length;
  const blockedCount = rows.filter((task) => task.status === "blocked").length;
  const avgResponse = "2.5h";

  return (
    <section className="h-full min-h-0 overflow-y-auto pr-1">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-[-0.03em]">Tasks</h1>
        </div>

        <StatStrip
          stats={[
            { label: "Open", value: String(openCount), hint: "Awaiting start" },
            { label: "In Progress", value: String(progressCount), hint: "Active development" },
            { label: "Blocked", value: String(blockedCount), hint: "Needs attention" },
            { label: "Avg Response", value: avgResponse, hint: "Operational speed" },
          ]}
        />

        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Active Task Operations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              rows={rows}
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
                    <p className="text-sm font-semibold text-slate-700">{task.assigneeName}</p>
                  )
                },
                {
                  key: "status",
                  title: "Status",
                  className: "text-center w-[160px] whitespace-nowrap",
                  render: (task) => (
                    <div className="flex justify-center">
                      <Badge
                        label={task.status.replace("_", " ")}
                        tone={task.status === "blocked" ? "danger" : task.status === "done" ? "success" : "info"}
                        className="whitespace-nowrap"
                      />
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
                  title: "Operations",
                  className: "text-left whitespace-nowrap",
                  render: (task) => (
                    <div className="flex justify-start items-center gap-2">
                      <Button variant="subtle" className="h-9 px-4 text-xs font-bold" onClick={() => updateTaskStatus(task.id, "in_progress")}>
                        Start
                      </Button>
                      <Button variant="subtle" className="h-9 px-4 text-xs font-bold" onClick={() => updateTaskStatus(task.id, "done")}>
                        Done
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 w-9 p-0 flex items-center justify-center hover:bg-slate-100 rounded-full"
                        title="Reassign Task"
                        onClick={() => {
                          const nextUser = users.find((user) => user.id !== task.assigneeId);
                          if (nextUser) reassignTask(task.id, nextUser.id);
                        }}
                      >
                         <Plus className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
