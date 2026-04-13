"use client";

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
    <section className="space-y-4">
      <PageContext
        breadcrumb={["Internal Hub", "Tasks"]}
        chipLabel="Task Screens"
        chips={[
          { label: "TK-01 List", active: true },
          { label: "TK-02 Board" },
          { label: "TK-03 Detail" },
          { label: "TK-04 Assignment" },
        ]}
        rightChips={[
          { label: "TK-05 SLA" },
          { label: "TK-06 Escalations" },
          { label: "TK-07 Audit Trail" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500">Fix blockers fast and rebalance work without leaving this screen.</p>
      </div>
      <StatStrip
        stats={[
          { label: "Open", value: String(openCount), valueTone: "warning" },
          { label: "In Progress", value: String(progressCount), valueTone: "default" },
          { label: "Blocked", value: String(blockedCount), valueTone: "danger" },
          { label: "Avg Response", value: avgResponse, valueTone: "success" },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Task Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={rows}
            columns={[
              {
                key: "task",
                title: "Task",
                render: (task) => (
                  <div>
                    <p className="font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.projectName}</p>
                  </div>
                ),
              },
              { key: "assignee", title: "Assignee", render: (task) => task.assigneeName },
              {
                key: "status",
                title: "Status",
                render: (task) => (
                  <Badge
                    label={task.status.replace("_", " ")}
                    tone={task.status === "blocked" ? "danger" : task.status === "done" ? "success" : "info"}
                  />
                ),
              },
              { key: "priority", title: "Priority", render: (task) => task.priority },
              { key: "due", title: "Due", render: (task) => formatDate(task.dueDate) },
              {
                key: "actions",
                title: "Quick Actions",
                render: (task) => (
                  <div className="flex gap-1">
                    <Button variant="subtle" className="text-xs" onClick={() => updateTaskStatus(task.id, "in_progress")}>
                      Start
                    </Button>
                    <Button variant="subtle" className="text-xs" onClick={() => updateTaskStatus(task.id, "done")}>
                      Done
                    </Button>
                    <Button
                      variant="subtle"
                      className="text-xs"
                      onClick={() => {
                        const nextUser = users.find((user) => user.id !== task.assigneeId);
                        if (nextUser) reassignTask(task.id, nextUser.id);
                      }}
                    >
                      Reassign
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
