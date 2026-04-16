"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FileEdit,
  FileText,
  Plus,
  Search,
  Send,
  X,
  CheckCircle2
} from "lucide-react";
import clsx from "clsx";

import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";

type ContractStatus = "draft" | "sent" | "signed" | "expired";

type Contract = {
  id: string;
  title: string;
  clientId: string;
  value: number;
  status: ContractStatus;
  effectiveDate: string;
  expiryDate: string;
  reference: string;
};

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: "cnt-1",
    title: "Master Service Agreement",
    clientId: "c1",
    value: 125000,
    status: "signed",
    effectiveDate: "2024-01-15",
    expiryDate: "2025-01-14",
    reference: "MSA-2024-001",
  },
  {
    id: "cnt-2",
    title: "Project Alpha Rollout Phase 2",
    clientId: "c2",
    value: 45000,
    status: "sent",
    effectiveDate: "2024-03-01",
    expiryDate: "2024-09-01",
    reference: "SOW-PA2-99",
  },
  {
    id: "cnt-3",
    title: "Consulting Framework Agreement",
    clientId: "c1",
    value: 80000,
    status: "draft",
    effectiveDate: "2024-04-10",
    expiryDate: "2025-04-09",
    reference: "CFA-BR-2024",
  },
  {
    id: "cnt-4",
    title: "Maintenance & Support v2",
    clientId: "c3",
    value: 12000,
    status: "expired",
    effectiveDate: "2023-01-01",
    expiryDate: "2023-12-31",
    reference: "SUP-MNT-23",
  },
];

type NewContractForm = {
  title: string;
  clientId: string;
  value: string;
  effectiveDate: string;
  expiryDate: string;
  reference: string;
};

const EMPTY_FORM: NewContractForm = {
  title: "",
  clientId: "",
  value: "",
  effectiveDate: "",
  expiryDate: "",
  reference: "",
};

export function ContractsPageClient() {
  const { clients } = useOpsStore();
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<NewContractForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalValue = contracts.reduce((sum, c) => sum + (c.status === "signed" ? c.value : 0), 0);
    const active = contracts.filter((c) => c.status === "signed").length;
    const pending = contracts.filter((c) => c.status === "sent").length;
    const expiringSoon = contracts.filter(
      (c) => c.status === "signed" && new Date(c.expiryDate) < new Date("2024-12-31")
    ).length;
    return [
      { label: "Active Agreements", value: String(active), hint: "Legally binding" },
      { label: "Pipeline Value", value: formatCurrency(totalValue), hint: "Signed value" },
      { label: "Pending Signature", value: String(pending), valueTone: "warning" as const, hint: "Out for review" },
      { label: "Expiring (90d)", value: String(expiringSoon), valueTone: "danger" as const, hint: "Requires attention" },
    ];
  }, [contracts]);

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case "signed": return <Badge label="Signed" tone="success" />;
      case "sent": return <Badge label="Sent" tone="warning" />;
      case "draft": return <Badge label="Draft" tone="neutral" />;
      case "expired": return <Badge label="Expired" tone="danger" />;
    }
  };

  const isFormValid = form.title.trim() && form.clientId && form.value && form.effectiveDate && form.expiryDate;

  const handleCreate = () => {
    if (!isFormValid) return;
    const newContract: Contract = {
      id: `cnt-${Date.now()}`,
      title: form.title.trim(),
      clientId: form.clientId,
      value: parseFloat(form.value) || 0,
      status: "draft",
      effectiveDate: form.effectiveDate,
      expiryDate: form.expiryDate,
      reference: form.reference.trim() || `REF-${Date.now()}`,
    };
    setContracts((prev) => [newContract, ...prev]);
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

  // Shared input/select classes matching the project modal
  const inputCls = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
  const selectCls = "appearance-none mt-1 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 shadow-sm";

  return (
    <>
      <section className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-[-0.03em]">Contracts</h1>
            </div>
            <Button
              variant="primary"
              className="gap-2 px-3 sm:px-6 h-11 font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">New Contract</span>
            </Button>
          </div>

          <StatStrip stats={stats} />

          {/* Search & Filter bar */}
          <div className="flex flex-row items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or reference..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative shrink-0">
              <select
                className="appearance-none cursor-pointer bg-white border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-sm text-slate-700 outline-none hover:bg-slate-50 focus:border-emerald-500 transition-colors shadow-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContractStatus | "all")}
              >
                <option value="all">All Status</option>
                <option value="signed">Signed</option>
                <option value="sent">Sent</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 uppercase tracking-widest text-[10px] font-bold text-slate-400 bg-slate-50/60">
                    <th className="px-6 py-4 rounded-tl-2xl">Title &amp; Reference</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4 text-right">Value</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Validity</th>
                    <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredContracts.map((contract) => {
                    const clientName = clients.find((c) => c.id === contract.clientId)?.name || "Unknown";
                    return (
                      <tr key={contract.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 tracking-tight">{contract.title}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{contract.reference}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-semibold text-slate-600">{clientName}</span>
                        </td>
                        <td className="px-6 py-5 text-right font-mono text-sm font-bold text-slate-700">
                          {formatCurrency(contract.value)}
                        </td>
                        <td className="px-6 py-5">{getStatusBadge(contract.status)}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <span>{new Date(contract.effectiveDate).toLocaleDateString()}</span>
                            <span className="text-slate-300">→</span>
                            <span>{new Date(contract.expiryDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="View Document">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <button className="p-2 cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Edit">
                              <FileEdit className="h-4 w-4" />
                            </button>
                            {contract.status === "draft" && (
                              <button className="p-2 cursor-pointer text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Send for Signature">
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            <button className="p-2 cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Download PDF">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredContracts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="font-bold text-slate-800">No contracts found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-[240px]">
                  We couldn&apos;t find any agreements matching your current filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* New Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">New Contract</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">Contract Created!</p>
                  <p className="text-sm text-slate-400 mt-0.5">Draft saved successfully</p>
                </div>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4 px-6 py-5"
                onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
              >
                <label className="block text-sm text-slate-600">
                  Contract Title
                  <input
                    type="text"
                    placeholder="e.g. Master Service Agreement"
                    className={inputCls}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-slate-600">
                    Client
                    <div className="relative mt-1">
                      <select
                        className={selectCls}
                        value={form.clientId}
                        onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                        required
                      >
                        <option value="">Select client…</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    </div>
                  </label>
                  <label className="block text-sm text-slate-600">
                    Value ($)
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      className={inputCls}
                      value={form.value}
                      onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                      required
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-slate-600">
                    Effective Date
                    <input
                      type="date"
                      className={inputCls}
                      value={form.effectiveDate}
                      onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                      required
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Expiry Date
                    <input
                      type="date"
                      className={inputCls}
                      value={form.expiryDate}
                      onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                      required
                    />
                  </label>
                </div>

                <label className="block text-sm text-slate-600">
                  Reference ID{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. MSA-2025-001"
                    className={inputCls}
                    value={form.reference}
                    onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  />
                </label>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-1">
                  <Button type="button" variant="ghost" className="flex-1 h-11 cursor-pointer" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-[2] h-11 shadow-lg disabled:opacity-30 disabled:grayscale transition-all cursor-pointer"
                    disabled={!isFormValid}
                  >
                    Save as Draft
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
