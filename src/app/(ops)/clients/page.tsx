"use client";

import Link from "next/link";
import { Columns3, Download, Search, SlidersHorizontal } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";
import { useShallow } from "zustand/react/shallow";

export default function ClientsPage() {
  const { clients, projects, invoices } = useOpsStore(
    useShallow((state) => ({
      clients: state.clients,
      projects: state.projects,
      invoices: state.invoices,
    })),
  );

  const rows = clients.map((client) => {
    const clientProjects = projects.filter((project) => project.clientId === client.id);
    const pending = invoices
      .filter((invoice) => invoice.clientId === client.id && invoice.status !== "paid")
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    return {
      ...client,
      projectCount: clientProjects.length,
      pending,
    };
  });
  const activeClients = rows.filter((client) => client.health !== "at_risk").length;
  const onboardingClients = rows.filter((client) => client.health === "watch").length;
  const totalRevenue = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const avgProjectValue = rows.length ? Math.round(projects.reduce((sum, project) => sum + project.budget, 0) / rows.length) : 0;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
      </div>

      <StatStrip
        stats={[
          { label: "Total Clients", value: String(rows.length) },
          { label: "Active", value: String(activeClients), valueTone: "success" },
          { label: "Onboarding", value: String(onboardingClients), valueTone: "warning" },
          { label: "Total Revenue", value: formatCurrency(totalRevenue), valueTone: "success" },
          { label: "Avg Project Value", value: formatCurrency(avgProjectValue) },
        ]}
      />

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Client Directory</CardTitle>
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
            rows={rows}
            columns={[
              {
                key: "name",
                title: "Client",
                render: (client) => (
                  <div>
                    <p className="font-medium text-slate-800">{client.name}</p>
                    <p className="text-xs text-slate-500">{client.industry}</p>
                  </div>
                ),
              },
              { key: "projects", title: "Projects", render: (client) => client.projectCount },
              { key: "rate", title: "Rate", render: (client) => `${formatCurrency(client.hourlyRate)}/h` },
              { key: "billing", title: "Billing", render: (client) => client.billingEmail },
              {
                key: "health",
                title: "Health",
                render: (client) => (
                  <Badge
                    label={client.health.replace("_", " ")}
                    tone={client.health === "at_risk" ? "danger" : client.health === "watch" ? "warning" : "success"}
                  />
                ),
              },
              {
                key: "pending",
                title: "Pending Amount",
                render: (client) => (
                  <span className={client.pending > 0 ? "text-rose-700" : "text-slate-500"}>
                    {formatCurrency(client.pending)}
                  </span>
                ),
              },
              {
                key: "details",
                title: "",
                render: (client) => (
                  <Link href={`/clients/${client.id}`} className="text-xs font-medium text-slate-700 hover:text-slate-900">
                    View details
                  </Link>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
