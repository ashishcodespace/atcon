"use client";

import { DataTable } from "@/components/shared/data-table";
import { PageContext } from "@/components/shared/page-context";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";
import { useShallow } from "zustand/react/shallow";

export function InvoicesPageClient({ statusFilter }: { statusFilter?: string }) {
  const { invoices, clients, projects, updateInvoiceStatus } = useOpsStore(
    useShallow((state) => ({
      invoices: state.invoices,
      clients: state.clients,
      projects: state.projects,
      updateInvoiceStatus: state.updateInvoiceStatus,
    })),
  );

  const rows = invoices
    .filter((invoice) => {
      if (statusFilter === "overdue") return invoice.status === "overdue";
      if (statusFilter === "pending") return invoice.status === "sent" || invoice.status === "overdue";
      return true;
    })
    .map((invoice) => ({
      ...invoice,
      clientName: clients.find((client) => client.id === invoice.clientId)?.name ?? "Unknown",
      projectName: projects.find((project) => project.id === invoice.projectId)?.name ?? "Unknown",
    }));
  const outstanding = rows.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdue = rows.filter((invoice) => invoice.status === "overdue").reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = rows.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <section className="h-full min-h-0 overflow-y-auto pr-1">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-3xl font-bold text-slate-800 tracking-[-0.03em]">Invoices</h1>
        </div>
        <StatStrip
          stats={[
            { label: "Total Revenue", value: formatCurrency(paid), hint: "Settled this period" },
            { label: "Outstanding", value: formatCurrency(outstanding), hint: "Pending payment" },
            { label: "Overdue", value: formatCurrency(overdue), hint: "Requires follow-up" },
            { label: "Invoices", value: String(rows.length), hint: "Total volume" },
          ]}
        />
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Invoice Tracker</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
          <DataTable
            rows={rows}
            columns={[
              { key: "id", title: "Invoice", render: (invoice) => invoice.id.toUpperCase() },
              {
                key: "scope",
                title: "Client / Project Cluster",
                render: (invoice) => (
                  <div>
                    <p className="font-bold text-slate-800 tracking-tight leading-none">{invoice.clientName}</p>
                    <p className="text-sm text-slate-400 mt-1 font-medium leading-none">{invoice.projectName}</p>
                  </div>
                ),
              },
              { key: "amount", title: "Amount", render: (invoice) => formatCurrency(invoice.amount) },
              { key: "due", title: "Due date", render: (invoice) => formatDate(invoice.dueDate) },
              {
                key: "status",
                title: "Status",
                render: (invoice) => (
                  <Badge
                    label={invoice.status}
                    tone={
                      invoice.status === "paid"
                        ? "success"
                        : invoice.status === "overdue"
                          ? "danger"
                          : "warning"
                    }
                  />
                ),
              },
              {
                key: "action",
                title: "Quick Action",
                render: (invoice) =>
                  invoice.status === "paid" ? (
                    <span className="text-xs text-slate-400">Settled</span>
                  ) : (
                    <div className="flex justify-start items-center gap-2">
                      <Button variant="subtle" className="h-9 px-4 text-xs font-bold" onClick={() => updateInvoiceStatus(invoice.id, "sent")}>
                        Send
                      </Button>
                      <Button variant="subtle" className="h-9 px-4 text-xs font-bold" onClick={() => updateInvoiceStatus(invoice.id, "paid")}>
                        Mark Paid
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
