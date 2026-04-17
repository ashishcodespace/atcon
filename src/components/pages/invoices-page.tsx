"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, CheckCircle2, ChevronDown } from "lucide-react";
import { AnimatedModal } from "@/components/shared/animated-modal";
import { formatCurrency, formatDate } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";
import { useShallow } from "zustand/react/shallow";

type NewInvoiceForm = {
  clientId: string;
  projectId: string;
  amount: string;
  dueDate: string;
};

const EMPTY_FORM: NewInvoiceForm = {
  clientId: "",
  projectId: "",
  amount: "",
  dueDate: "",
};

export function InvoicesPageClient({ statusFilter }: { statusFilter?: string }) {
  const { invoices, clients, projects, updateInvoiceStatus, addInvoice } = useOpsStore(
    useShallow((state) => ({
      invoices: state.invoices,
      clients: state.clients,
      projects: state.projects,
      updateInvoiceStatus: state.updateInvoiceStatus,
      addInvoice: state.addInvoice,
    })),
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<NewInvoiceForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

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

  const clientProjects = projects.filter(p => p.clientId === form.clientId);
  const isFormValid = form.clientId && form.projectId && form.amount && form.dueDate;

  const handleCreate = () => {
    if (!isFormValid) return;
    const newInvoice = {
      id: `inv-${Date.now()}`,
      clientId: form.clientId,
      projectId: form.projectId,
      amount: parseFloat(form.amount) || 0,
      dueDate: form.dueDate,
      status: "draft" as const,
    };
    addInvoice(newInvoice);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
    }, 1400);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setSubmitted(false);
  };

  return (
    <>
      <section className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-3xl font-bold text-slate-800 tracking-[-0.03em]">Invoices</h1>
            <Button 
              variant="primary" 
              className="gap-2 px-3 sm:px-6 h-11 font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">New Invoice</span>
            </Button>
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

      {/* New Invoice Modal */}
      <AnimatedModal isOpen={showCreateModal} onClose={closeModal}>
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between p-7 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">New Invoice</h2>
                <p className="text-sm text-slate-400 mt-0.5">Create a draft invoice for a project</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full text-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">Invoice Created!</p>
                  <p className="text-sm text-slate-400 mt-0.5">Draft saved successfully</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-7 space-y-4">
                  <label className="block text-sm text-slate-600">
                    Client
                    <div className="relative mt-1">
                      <select
                        className="appearance-none w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 shadow-sm"
                        value={form.clientId}
                        onChange={e => setForm(f => ({ ...f, clientId: e.target.value, projectId: "" }))}
                      >
                        <option value="">Select client…</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    </div>
                  </label>

                  <label className="block text-sm text-slate-600">
                    Project
                    <div className="relative mt-1">
                      <select
                        className={`appearance-none w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 shadow-sm ${!form.clientId ? 'opacity-40 cursor-not-allowed' : ''}`}
                        value={form.projectId}
                        onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                        disabled={!form.clientId}
                      >
                        <option value="">Select project…</option>
                        {clientProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    </div>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm text-slate-600">
                      Amount ($)
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        value={form.amount}
                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm text-slate-600">
                      Due Date
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-emerald-500"
                        value={form.dueDate}
                        onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-1 px-7 py-5 bg-slate-50/50">
                  <Button type="button" variant="ghost" className="flex-1 h-11 cursor-pointer" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-[2] h-11 shadow-lg disabled:opacity-30 disabled:grayscale transition-all cursor-pointer"
                    disabled={!isFormValid}
                    onClick={handleCreate}
                  >
                    Create Invoice
                  </Button>
                </div>
              </>
            )}
          </div>
      </AnimatedModal>
    </>
  );
}
