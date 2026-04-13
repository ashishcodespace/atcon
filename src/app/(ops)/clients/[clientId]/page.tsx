"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const { clients, projects, tasks, invoices, users, timeLogs, updateInvoiceStatus } = useOpsStore(
    useShallow((state) => ({
      clients: state.clients,
      projects: state.projects,
      tasks: state.tasks,
      invoices: state.invoices,
      users: state.users,
      timeLogs: state.timeLogs,
      updateInvoiceStatus: state.updateInvoiceStatus,
    })),
  );

  const client = clients.find((item) => item.id === clientId);
  const clientProjects = projects.filter((project) => project.clientId === clientId);
  const projectIds = clientProjects.map((project) => project.id);
  const clientTasks = tasks.filter((task) => projectIds.includes(task.projectId));
  const clientInvoices = invoices.filter((invoice) => invoice.clientId === clientId);
  const clientLogs = timeLogs.filter((log) => projectIds.includes(log.projectId));

  const activityRows = clientLogs
    .map((log) => {
      const task = tasks.find((item) => item.id === log.taskId);
      const user = users.find((item) => item.id === log.userId);
      return {
        ...log,
        taskTitle: task?.title ?? "Task",
        userName: user?.name ?? "User",
      };
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  if (!client) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-slate-600">Client not found.</p>
          <Link href="/clients" className="mt-2 inline-block text-sm text-slate-700 underline">
            Back to clients
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{client.name}</h1>
          <p className="text-sm text-slate-500">
            {client.industry} · {client.billingEmail}
          </p>
        </div>
        <Badge
          label={client.health.replace("_", " ")}
          tone={client.health === "at_risk" ? "danger" : client.health === "watch" ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{clientProjects.length}</p>
            <p className="text-sm text-slate-500">
              {clientProjects.filter((project) => project.status === "delayed").length} delayed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Billable Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {clientLogs.filter((log) => log.billable).reduce((sum, log) => sum + log.hours, 0)}h
            </p>
            <p className="text-sm text-slate-500">{formatCurrency(client.hourlyRate)}/hour rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(
                clientInvoices
                  .filter((invoice) => invoice.status !== "paid")
                  .reduce((sum, invoice) => sum + invoice.amount, 0),
              )}
            </p>
            <p className="text-sm text-slate-500">Open invoicing exposure</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Project Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={clientProjects}
              columns={[
                { key: "name", title: "Project", render: (project) => project.name },
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
                { key: "progress", title: "Progress", render: (project) => `${project.progress}%` },
                { key: "budget", title: "Budget", render: (project) => formatCurrency(project.budget) },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <Link href="/invoices?status=overdue" className="text-xs text-slate-500 hover:text-slate-700">
              Open invoice center
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {clientInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{invoice.id.toUpperCase()}</p>
                    <p className="text-xs text-slate-500">Due {formatDate(invoice.dueDate)}</p>
                  </div>
                  <Badge
                    label={invoice.status}
                    tone={
                      invoice.status === "overdue"
                        ? "danger"
                        : invoice.status === "paid"
                          ? "success"
                          : "warning"
                    }
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(invoice.amount)}</p>
                  {invoice.status !== "paid" && (
                    <Button
                      variant="subtle"
                      className="text-xs"
                      onClick={() => updateInvoiceStatus(invoice.id, invoice.status === "overdue" ? "sent" : "paid")}
                    >
                      {invoice.status === "overdue" ? "Send reminder" : "Mark paid"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={activityRows}
            columns={[
              { key: "date", title: "Date", render: (log) => formatDate(log.date) },
              { key: "task", title: "Task", render: (log) => log.taskTitle },
              { key: "user", title: "Team Member", render: (log) => log.userName },
              { key: "hours", title: "Hours", render: (log) => `${log.hours}h` },
              {
                key: "cost",
                title: "Value",
                render: (log) => formatCurrency(log.hours * client.hourlyRate),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {["todo", "in_progress", "blocked", "done"].map((status) => (
              <div key={status} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">{status.replace("_", " ")}</p>
                <p className="text-xl font-semibold text-slate-900">
                  {clientTasks.filter((task) => task.status === status).length}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
