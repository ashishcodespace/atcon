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
    <section className="space-y-4">
      <PageContext
        breadcrumb={["Internal Hub", "Finance"]}
        chipLabel="Finance Screens"
        chips={[
          { label: "FI-01 Dashboard", active: true },
          { label: "FI-02 Invoices List" },
          { label: "FI-03 Create Invoice" },
          { label: "FI-04 Timesheet Billing" },
        ]}
        rightChips={[
          { label: "FI-05 Generate Invoice" },
          { label: "FI-06 Expenses" },
          { label: "FI-07 Forecast" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
        <p className="text-sm text-slate-500">Convert effort to cash and clear overdue receivables quickly.</p>
      </div>
      <StatStrip
        stats={[
          { label: "Total Revenue", value: formatCurrency(paid), valueTone: "success" },
          { label: "Outstanding", value: formatCurrency(outstanding), valueTone: "warning" },
          { label: "Overdue", value: formatCurrency(overdue), valueTone: "danger" },
          { label: "Invoices", value: String(rows.length) },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Invoice Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={rows}
            columns={[
              { key: "id", title: "Invoice", render: (invoice) => invoice.id.toUpperCase() },
              {
                key: "scope",
                title: "Client / Project",
                render: (invoice) => (
                  <div>
                    <p className="font-medium text-slate-800">{invoice.clientName}</p>
                    <p className="text-xs text-slate-500">{invoice.projectName}</p>
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
                    <div className="flex gap-1">
                      <Button variant="subtle" className="text-xs" onClick={() => updateInvoiceStatus(invoice.id, "sent")}>
                        Send
                      </Button>
                      <Button variant="subtle" className="text-xs" onClick={() => updateInvoiceStatus(invoice.id, "paid")}>
                        Mark paid
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
