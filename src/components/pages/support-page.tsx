"use client";

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown, KanbanSquare, LayoutList, Plus, Search, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { DataTable } from "@/components/shared/data-table";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpsStore } from "@/store/ops-store";
import { SupportTicketPriority, SupportTicketStatus } from "@/types/domain";

type ViewMode = "list" | "kanban";

type TicketForm = {
  title: string;
  clientId: string;
  projectId: string;
  ownerId: string;
  priority: SupportTicketPriority;
  channel: "email" | "portal" | "call";
  category: "bug" | "billing" | "access" | "question" | "feature";
  description: string;
};

export function SupportPageClient() {
  const { supportTickets, clients, projects, users, addSupportTicket, updateSupportTicketStatus, assignSupportTicketOwner } =
    useOpsStore(
      useShallow((state) => ({
        supportTickets: state.supportTickets,
        clients: state.clients,
        projects: state.projects,
        users: state.users,
        addSupportTicket: state.addSupportTicket,
        updateSupportTicketStatus: state.updateSupportTicketStatus,
        assignSupportTicketOwner: state.assignSupportTicketOwner,
      })),
    );

  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<SupportTicketPriority | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [form, setForm] = useState<TicketForm>({
    title: "",
    clientId: clients[0]?.id ?? "",
    projectId: projects[0]?.id ?? "",
    ownerId: users[0]?.id ?? "",
    priority: "medium",
    channel: "portal",
    category: "question",
    description: "",
  });

  const filteredTickets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return supportTickets.filter((ticket) => {
      const clientName = clients.find((client) => client.id === ticket.clientId)?.name ?? "";
      const ownerName = users.find((user) => user.id === ticket.ownerId)?.name ?? "";
      const matchQuery =
        !normalized ||
        ticket.title.toLowerCase().includes(normalized) ||
        clientName.toLowerCase().includes(normalized) ||
        ownerName.toLowerCase().includes(normalized);
      const matchStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      return matchQuery && matchStatus && matchPriority;
    });
  }, [supportTickets, clients, users, query, statusFilter, priorityFilter]);

  const openCount = filteredTickets.filter((ticket) => ticket.status === "open").length;
  const progressCount = filteredTickets.filter((ticket) => ticket.status === "in_progress").length;
  const resolvedCount = filteredTickets.filter(
    (ticket) => ticket.status === "resolved" || ticket.status === "closed",
  ).length;
  const avgResponse = filteredTickets.length
    ? (filteredTickets.reduce((sum, ticket) => sum + ticket.firstResponseMinutes, 0) / filteredTickets.length / 60).toFixed(1)
    : "0.0";

  const ticketsWithRefs = filteredTickets.map((ticket) => ({
    ...ticket,
    clientName: clients.find((client) => client.id === ticket.clientId)?.name ?? "Unknown",
    projectName: projects.find((project) => project.id === ticket.projectId)?.name ?? "General Support",
    ownerName: users.find((user) => user.id === ticket.ownerId)?.name ?? "Unassigned",
  }));

  const boardColumns: { label: string; status: SupportTicketStatus; tone: "warning" | "info" | "success" | "neutral" }[] = [
    { label: "Open", status: "open", tone: "warning" },
    { label: "In Progress", status: "in_progress", tone: "info" },
    { label: "Resolved", status: "resolved", tone: "success" },
    { label: "Closed", status: "closed", tone: "neutral" },
  ];

  const saveTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.clientId || !form.ownerId) return;

    addSupportTicket({
      title: form.title.trim(),
      clientId: form.clientId,
      projectId: form.projectId || undefined,
      ownerId: form.ownerId,
      status: "open",
      priority: form.priority,
      channel: form.channel,
      category: form.category,
      firstResponseMinutes: 30,
      description: form.description.trim() || "New support request created from demo UI.",
    });

    setShowCreateModal(false);
    setForm((prev) => ({
      ...prev,
      title: "",
      description: "",
      priority: "medium",
      category: "question",
    }));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-[-0.03em]">Support Tickets</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              className={clsx("rounded-lg p-2", view === "list" ? "bg-slate-100 text-slate-900" : "text-slate-500")}
              onClick={() => setView("list")}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={clsx("rounded-lg p-2", view === "kanban" ? "bg-slate-100 text-slate-900" : "text-slate-500")}
              onClick={() => setView("kanban")}
            >
              <KanbanSquare className="h-4 w-4" />
            </button>
          </div>
          <Button className="gap-2 px-3 sm:px-4" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </Button>
        </div>
      </div>



      <StatStrip
        stats={[
          { label: "Open", value: String(openCount), hint: "Awaiting first resolution step" },
          { label: "In Progress", value: String(progressCount), hint: "Actively handled" },
          { label: "Resolved", value: String(resolvedCount), hint: "Resolved + closed" },
          { label: "Avg Response", value: `${avgResponse}h`, hint: "First response time" },
        ]}
      />

      {view === "list" ? (
        <Card>
          <CardHeader className="px-6 py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold">Support Queue</CardTitle>
            <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-50 focus:border-emerald-500 transition-colors"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SupportTicketStatus | "all")}
                >
                  <option value="all">Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-50 focus:border-emerald-500 transition-colors"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as SupportTicketPriority | "all")}
                >
                  <option value="all">Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={ticketsWithRefs}
              minWidth="1100px"
              emptyMessage="No support tickets match current filters."
              columns={[
                {
                  key: "ticket",
                  title: "Ticket",
                  render: (ticket) => (
                    <div>
                      <p className="font-semibold text-slate-800">{ticket.title}</p>
                      <p className="text-xs text-slate-500">
                        {ticket.clientName} · {ticket.projectName}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "priority",
                  title: "Priority",
                  render: (ticket) => (
                    <Badge
                      label={ticket.priority}
                      tone={
                        ticket.priority === "urgent"
                          ? "danger"
                          : ticket.priority === "high"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  ),
                },
                {
                  key: "channel",
                  title: "Channel",
                  render: (ticket) => <span className="text-sm capitalize text-slate-600">{ticket.channel}</span>,
                },
                {
                  key: "owner",
                  title: "Owner",
                  render: (ticket) => (
                    <select
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                      value={ticket.ownerId}
                      onChange={(event) => assignSupportTicketOwner(ticket.id, event.target.value)}
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  ),
                },
                {
                  key: "status",
                  title: "Status",
                  render: (ticket) => (
                    <select
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                      value={ticket.status}
                      onChange={(event) =>
                        updateSupportTicketStatus(ticket.id, event.target.value as SupportTicketStatus)
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  ),
                },
                {
                  key: "response",
                  title: "1st Response",
                  render: (ticket) => <span className="text-sm text-slate-600">{ticket.firstResponseMinutes}m</span>,
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Support Board</h2>
            <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cards..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as SupportTicketPriority | "all")}
                >
                  <option value="all">Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            {boardColumns.map((column) => {
              const columnRows = ticketsWithRefs.filter((ticket) => ticket.status === column.status);
              return (
                <Card key={column.status}>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>{column.label}</CardTitle>
                    <Badge label={`${columnRows.length}`} tone={column.tone} />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {columnRows.map((ticket) => (
                      <div key={ticket.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-medium text-slate-800">{ticket.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {ticket.clientName} · {ticket.ownerName}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge label={ticket.priority} tone={ticket.priority === "urgent" ? "danger" : "neutral"} />
                          <select
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
                            value={ticket.status}
                            onChange={(event) =>
                              updateSupportTicketStatus(ticket.id, event.target.value as SupportTicketStatus)
                            }
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {columnRows.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                        No tickets in this stage.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {showCreateModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create Support Ticket</h2>
                <p className="text-sm text-slate-500">Log and route a new request from demo UI.</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-4 px-5 py-4" onSubmit={saveTicket}>
              <label className="block text-sm text-slate-600">
                Ticket title
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-600">
                  Client
                  <div className="relative mt-1">
                    <select
                      className="appearance-none w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500"
                      value={form.clientId}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          clientId: event.target.value,
                          projectId: projects.find((project) => project.clientId === event.target.value)?.id ?? "",
                        }))
                      }
                    >
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </label>
                <label className="text-sm text-slate-600">
                  Project
                  <div className="relative mt-1">
                    <select
                      className="appearance-none w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500"
                      value={form.projectId}
                      onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
                    >
                      <option value="">General support</option>
                      {projects
                        .filter((project) => project.clientId === form.clientId)
                        .map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-sm text-slate-600">
                  Priority
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={form.priority}
                    onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as SupportTicketPriority }))}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="text-sm text-slate-600">
                  Channel
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={form.channel}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, channel: event.target.value as TicketForm["channel"] }))
                    }
                  >
                    <option value="portal">Portal</option>
                    <option value="email">Email</option>
                    <option value="call">Call</option>
                  </select>
                </label>
                <label className="text-sm text-slate-600">
                  Category
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, category: event.target.value as TicketForm["category"] }))
                    }
                  >
                    <option value="bug">Bug</option>
                    <option value="billing">Billing</option>
                    <option value="access">Access</option>
                    <option value="question">Question</option>
                    <option value="feature">Feature</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm text-slate-600">
                Owner
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={form.ownerId}
                  onChange={(event) => setForm((prev) => ({ ...prev, ownerId: event.target.value }))}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                Description
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Add context, impact, and expected outcome..."
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Ticket</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
