"use client";

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, Plus, Users, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";

type TimesheetTab = "my" | "all";

type AddTimeForm = {
  userId: string;
  projectId: string;
  taskId: string;
  date: string;
  hours: string;
  billable: boolean;
  notes: string;
};

const DAY_NAME = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const DAY_DATE = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });

function toIsoDate(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateInRange(dateIso: string, start: Date, end: Date) {
  const value = new Date(`${dateIso}T00:00:00`);
  return value >= start && value <= end;
}

export function TimesheetPageClient() {
  const { users, projects, tasks, timeLogs, clients, addTimeLog } = useOpsStore(
    useShallow((state) => ({
      users: state.users,
      projects: state.projects,
      tasks: state.tasks,
      timeLogs: state.timeLogs,
      clients: state.clients,
      addTimeLog: state.addTimeLog,
    })),
  );

  const defaultUserId = users[1]?.id ?? users[0]?.id ?? "";
  const [activeTab, setActiveTab] = useState<TimesheetTab>("my");
  const [selectedUserId, setSelectedUserId] = useState(defaultUserId);

  const initialWeek = useMemo(() => {
    const latestLog = [...timeLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
    return startOfWeek(new Date(`${latestLog?.date ?? toIsoDate(new Date())}T00:00:00`));
  }, [timeLogs]);

  const [weekStart, setWeekStart] = useState(initialWeek);
  const [showAddModal, setShowAddModal] = useState(false);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, idx) => addDays(weekStart, idx)), [weekStart]);

  const logsInWeek = useMemo(
    () => timeLogs.filter((log) => dateInRange(log.date, weekStart, weekEnd)),
    [timeLogs, weekStart, weekEnd],
  );

  const visibleUsers = useMemo(() => {
    if (activeTab === "my") {
      const selected = users.find((user) => user.id === selectedUserId);
      return selected ? [selected] : users.slice(0, 1);
    }
    return users;
  }, [activeTab, selectedUserId, users]);

  const totalHours = logsInWeek.reduce((sum, log) => sum + log.hours, 0);
  const billableHours = logsInWeek.filter((log) => log.billable).reduce((sum, log) => sum + log.hours, 0);
  const activeMembers = new Set(logsInWeek.map((log) => log.userId)).size;
  const avgDailyHours = totalHours ? (totalHours / weekDays.length).toFixed(1) : "0.0";
  const estimatedValue = logsInWeek
    .filter((log) => log.billable)
    .reduce((sum, log) => {
      const project = projects.find((item) => item.id === log.projectId);
      const client = clients.find((item) => item.id === project?.clientId);
      return sum + log.hours * (client?.hourlyRate ?? 0);
    }, 0);

  const projectBreakdown = useMemo(() => {
    return projects
      .map((project) => {
        const logs = logsInWeek.filter((log) => log.projectId === project.id);
        const total = logs.reduce((sum, log) => sum + log.hours, 0);
        if (!total) return null;
        const billable = logs.filter((log) => log.billable).reduce((sum, log) => sum + log.hours, 0);
        const client = clients.find((item) => item.id === project.clientId);
        return {
          projectId: project.id,
          projectName: project.name,
          clientName: client?.name ?? "Unknown",
          billable,
          nonBillable: total - billable,
          total,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.total - a.total);
  }, [projects, logsInWeek, clients]);

  const defaultProjectId = projects[0]?.id ?? "";
  const defaultTaskId = tasks.find((task) => task.projectId === defaultProjectId)?.id ?? tasks[0]?.id ?? "";
  const [form, setForm] = useState<AddTimeForm>({
    userId: defaultUserId,
    projectId: defaultProjectId,
    taskId: defaultTaskId,
    date: toIsoDate(weekStart),
    hours: "",
    billable: true,
    notes: "",
  });

  const tasksForSelectedProject = useMemo(
    () => tasks.filter((task) => task.projectId === form.projectId),
    [tasks, form.projectId],
  );

  const weeklyHoursByUser = (userId: string) =>
    logsInWeek.filter((log) => log.userId === userId).reduce((sum, log) => sum + log.hours, 0);

  const dayHoursForUser = (userId: string, day: Date) => {
    const dayIso = toIsoDate(day);
    return logsInWeek
      .filter((log) => log.userId === userId && log.date === dayIso)
      .reduce((sum, log) => sum + log.hours, 0);
  };

  const handleCreateEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedHours = Number(form.hours);
    if (!form.userId || !form.projectId || !form.taskId || !form.date || !Number.isFinite(parsedHours) || parsedHours <= 0) {
      return;
    }

    addTimeLog({
      userId: form.userId,
      projectId: form.projectId,
      taskId: form.taskId,
      date: form.date,
      hours: parsedHours,
      billable: form.billable,
    });

    setShowAddModal(false);
    setForm((prev) => ({ ...prev, hours: "", notes: "" }));
  };

  return (
    <section className="space-y-4">
      {/* <PageContext
        breadcrumb={[]}
        chipLabel="Time Screens"
        chips={[
          { label: "TM-01 Weekly Sheet", active: true },
          { label: "TM-02 Add Time" },
          { label: "TM-03 Approvals" },
          { label: "TM-04 Billing Sync" },
        ]}
        rightChips={[
          { label: "TM-05 Capacity" },
          { label: "TM-06 Utilization" },
          { label: "TM-07 Audit Trail" },
        ]}
      /> */}

      <div className="flex flex-row items-center justify-between sm:flex-wrap lg:flex-nowrap gap-3 py-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-[-0.03em] shrink-0">Timesheet</h1>

        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <div className="flex items-center rounded-xl border border-slate-200/60 bg-white shadow-sm overflow-hidden text-sm shrink-0">
            <button type="button" className="p-2 sm:p-2.5 transition-colors hover:bg-slate-50 text-slate-600" onClick={() => setWeekStart((prev) => addDays(prev, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2 py-1.5 font-semibold text-slate-800">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">This Week</span>
            </div>
            <button type="button" className="p-2 sm:p-2.5 transition-colors hover:bg-slate-50 text-slate-600" onClick={() => setWeekStart((prev) => addDays(prev, 7))}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Button className="gap-2 cursor-pointer px-4 sm:px-6 shrink-0 h-10 sm:h-11 font-semibold tracking-tight shadow-md hover:shadow-lg transition-all" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="hidden sm:inline">Add Time</span>
          </Button>
        </div>
      </div>

      <StatStrip
        stats={[
          { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, hint: "Current week" },
          { label: "Billable Hours", value: `${billableHours.toFixed(1)}h`, hint: `${Math.round((billableHours / Math.max(totalHours, 1)) * 100)}% billable mix` },
          { label: "Active Members", value: String(activeMembers), hint: "Logged this week" },
          { label: "Avg Daily Hours", value: `${avgDailyHours}h`, hint: "Mon-Fri average" },
          // { label: "Estimated Billable Value", value: formatCurrency(estimatedValue), hint: "Based on client rates" },
        ]}
      />

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 bg-slate-50/30 border-b border-slate-100/50">
          <div className="flex items-center gap-1 sm:gap-2 rounded-xl border border-slate-200 bg-slate-100/40 p-1">
            <button
              type="button"
              className={clsx(
                "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer",
                activeTab === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50",
              )}
              onClick={() => setActiveTab("my")}
            >
              My Timesheet
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer",
                activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50",
              )}
              onClick={() => setActiveTab("all")}
            >
              All Team
            </button>
          </div>

          {activeTab === "my" ? (
            <label className="text-sm text-slate-600 flex items-center gap-2">
              Member
              <div className="relative">
                <select
                  className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
            </label>
          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Member</th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                      <p>{DAY_NAME.format(day)}</p>
                      <p className="text-[10px] font-medium text-slate-300 mt-0.5">{DAY_DATE.format(day)}</p>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Total</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {visibleUsers.map((user) => {
                  const userTotal = weeklyHoursByUser(user.id);
                  const utilization = Math.round((userTotal / Math.max(user.capacityHours, 1)) * 100);
                  return (
                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 tracking-tight leading-none">{user.name}</p>
                        <p className="text-sm text-slate-400 mt-1 font-medium leading-none">{user.role}</p>
                      </td>
                      {weekDays.map((day) => {
                        const hours = dayHoursForUser(user.id, day);
                        return (
                          <td key={`${user.id}-${day.toISOString()}`} className="px-6 py-4">
                            <div className="inline-flex min-w-16 justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm group-hover:border-slate-300 transition-all">
                              {hours > 0 ? `${hours.toFixed(1)}h` : "-"}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">{userTotal.toFixed(1)}h</td>
                      <td className="px-6 py-4">
                        <Badge
                          label={`${utilization}%`}
                          tone={utilization > 95 ? "danger" : utilization > 80 ? "warning" : "success"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card className="rounded-xl border-slate-100 shadow-none">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  Project Breakdown
                </CardTitle>
                <Badge label={`${projectBreakdown.length} active`} tone="neutral" />
              </CardHeader>
              <CardContent className="space-y-2">
                {projectBreakdown.map((row) => (
                  <div key={row.projectId} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{row.projectName}</p>
                        <p className="text-xs text-slate-500">{row.clientName}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{row.total.toFixed(1)}h</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Billable {row.billable.toFixed(1)}h · Internal {row.nonBillable.toFixed(1)}h
                    </p>
                  </div>
                ))}
                {projectBreakdown.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                    No logs for this week yet.
                  </p>
                ) : null}
              </CardContent>
            </Card>


          </div>
        </CardContent>
      </Card>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add Time Entry</h2>
                <p className="text-sm text-slate-500">Log task effort with billing context.</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-4 px-5 py-4" onSubmit={handleCreateEntry}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-600">
                  Member
                  <div className="relative mt-1">
                    <select
                      className="appearance-none w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                      value={form.userId}
                      onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </label>

                <label className="text-sm text-slate-600">
                  Date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={form.date}
                    onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-600">
                  Project
                  <div className="relative mt-1">
                    <select
                      className="appearance-none w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                      value={form.projectId}
                      onChange={(event) => {
                        const nextProjectId = event.target.value;
                        const nextTaskId = tasks.find((task) => task.projectId === nextProjectId)?.id ?? "";
                        setForm((prev) => ({ ...prev, projectId: nextProjectId, taskId: nextTaskId }));
                      }}
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </label>

                <label className="text-sm text-slate-600">
                  Task
                  <div className="relative mt-1">
                    <select
                      className="appearance-none w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                      value={form.taskId}
                      onChange={(event) => setForm((prev) => ({ ...prev, taskId: event.target.value }))}
                      required
                    >
                      {tasksForSelectedProject.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-600">
                  Hours
                  <input
                    type="number"
                    min={0.25}
                    step={0.25}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={form.hours}
                    onChange={(event) => setForm((prev) => ({ ...prev, hours: event.target.value }))}
                    required
                  />
                </label>

                <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.billable}
                    onChange={(event) => setForm((prev) => ({ ...prev, billable: event.target.checked }))}
                  />
                  Mark as billable
                </label>
              </div>

              <label className="text-sm text-slate-600">
                Notes
                <textarea
                  rows={3}
                  placeholder="What did you work on?"
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
