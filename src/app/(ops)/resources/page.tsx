"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOpsStore } from "@/store/ops-store";
import { getUserLoad } from "@/lib/ops-logic";
import { useShallow } from "zustand/react/shallow";
import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";

export default function ResourcesPage() {
  const { users, tasks } = useOpsStore(
    useShallow((state) => ({
      users: state.users,
      tasks: state.tasks,
    })),
  );

  const rows = users.map((user) => ({
    user,
    load: getUserLoad(user, tasks),
  }));
  const employees = rows.length;
  const available = rows.filter((item) => item.load.utilization < 75).length;
  const busy = rows.filter((item) => item.load.utilization >= 90).length;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Resources</h1>
      </div>
      <StatStrip
        stats={[
          { label: "Total People", value: String(employees) },
          { label: "Available", value: String(available), valueTone: "success" },
          { label: "Busy", value: String(busy), valueTone: "warning" },
          { label: "Overloaded", value: String(rows.filter((item) => item.load.utilization > 100).length), valueTone: "danger" },
        ]}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(({ user, load }) => (
          <Card key={user.id}>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{user.name}</CardTitle>
              <Badge
                label={`${load.utilization}%`}
                tone={load.utilization > 90 ? "danger" : load.utilization > 75 ? "warning" : "success"}
              />
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-slate-600">
              <p>{user.role}</p>
              <p>{load.taskCount} active tasks</p>
              <p>{load.hours}h assigned / {user.capacityHours}h capacity</p>
              <p className="text-xs text-slate-500">
                Availability: {Math.max(0, user.capacityHours - load.hours)}h remaining
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
