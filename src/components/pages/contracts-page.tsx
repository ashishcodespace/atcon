"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileEdit,
  FileText,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import { AnimatedModal } from "@/components/shared/animated-modal";

import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";
import { Contract, ContractStatus } from "@/types/domain";

type ContractForm = {
  title: string;
  clientId: string;
  value: string;
  effectiveDate: string;
  expiryDate: string;
  reference: string;
};

const EMPTY_FORM: ContractForm = {
  title: "",
  clientId: "",
  value: "",
  effectiveDate: "",
  expiryDate: "",
  reference: "",
};

export function ContractsPageClient() {
  const { clients, contracts, addContract, updateContract, updateContractStatus } = useOpsStore(
    useShallow((state) => ({
      clients: state.clients,
      contracts: state.contracts,
      addContract: state.addContract,
      updateContract: state.updateContract,
      updateContractStatus: state.updateContractStatus,
    })),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<ContractForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [previewContractId, setPreviewContractId] = useState<string | null>(null);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const clientName = clients.find((client) => client.id === contract.clientId)?.name ?? "";
      const matchesSearch =
        contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, clients, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalValue = contracts.reduce(
      (sum, contract) => sum + (contract.status === "signed" ? contract.value : 0),
      0,
    );
    const active = contracts.filter((contract) => contract.status === "signed").length;
    const pending = contracts.filter((contract) => contract.status === "sent").length;
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const expiringSoon = contracts.filter(
      (contract) =>
        contract.status === "signed" && new Date(`${contract.expiryDate}T00:00:00`) <= ninetyDaysFromNow,
    ).length;
    return [
      { label: "Active Agreements", value: String(active), hint: "Legally binding" },
      { label: "Pipeline Value", value: formatCurrency(totalValue), hint: "Signed value" },
      {
        label: "Pending Signature",
        value: String(pending),
        valueTone: "warning" as const,
        hint: "Out for review",
      },
      {
        label: "Expiring (90d)",
        value: String(expiringSoon),
        valueTone: "danger" as const,
        hint: "Requires attention",
      },
    ];
  }, [contracts]);

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case "signed":
        return <Badge label="Signed" tone="success" />;
      case "sent":
        return <Badge label="Sent" tone="warning" />;
      case "draft":
        return <Badge label="Draft" tone="neutral" />;
      case "expired":
        return <Badge label="Expired" tone="danger" />;
    }
  };

  const isFormValid = form.title.trim() && form.clientId && form.value && form.effectiveDate && form.expiryDate;

  const closeModal = () => {
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setEditingContractId(null);
  };

  const openCreateModal = () => {
    setEditingContractId(null);
    setForm(EMPTY_FORM);
    setShowCreateModal(true);
  };

  const openEditModal = (contract: Contract) => {
    setEditingContractId(contract.id);
    setForm({
      title: contract.title,
      clientId: contract.clientId,
      value: String(contract.value),
      effectiveDate: contract.effectiveDate,
      expiryDate: contract.expiryDate,
      reference: contract.reference,
    });
    setShowCreateModal(true);
  };

  const handleSaveContract = () => {
    if (!isFormValid) return;

    const payload = {
      title: form.title.trim(),
      clientId: form.clientId,
      value: Number(form.value) || 0,
      status: "draft" as const,
      effectiveDate: form.effectiveDate,
      expiryDate: form.expiryDate,
      reference:
        form.reference.trim() || `${form.title.trim().slice(0, 3).toUpperCase()}-${new Date().getFullYear()}`,
    };

    if (editingContractId) {
      updateContract(editingContractId, payload);
    } else {
      addContract(payload);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
      setEditingContractId(null);
    }, 900);
  };

  const downloadContractSummary = (contract: Contract) => {
    const clientName = clients.find((client) => client.id === contract.clientId)?.name ?? "Unknown client";
    const content = [
      `Contract: ${contract.title}`,
      `Reference: ${contract.reference}`,
      `Client: ${clientName}`,
      `Value: ${formatCurrency(contract.value)}`,
      `Status: ${contract.status}`,
      `Effective Date: ${contract.effectiveDate}`,
      `Expiry Date: ${contract.expiryDate}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${contract.reference || contract.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const previewContract = contracts.find((contract) => contract.id === previewContractId);
  const inputCls =
    "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
  const selectCls =
    "appearance-none mt-1 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-500 shadow-sm";

  return (
    <>
      <section className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6 pb-6">
          <div className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-[-0.03em]">Contracts</h1>
            </div>
            <Button
              variant="primary"
              className="gap-2 px-3 sm:px-6 h-11 font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={openCreateModal}
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">New Contract</span>
            </Button>
          </div>

          <StatStrip stats={stats} />

          <div className="flex flex-row items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, client, or reference..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="relative shrink-0">
              <select
                className="appearance-none cursor-pointer bg-white border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-sm text-slate-700 outline-none hover:bg-slate-50 focus:border-emerald-500 transition-colors shadow-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ContractStatus | "all")}
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

          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            {/* Table */}
            <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Contract Directory</h2>
                <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 md:flex-none md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by title or reference..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all dark:text-slate-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative shrink-0">
                    <select
                      className="appearance-none cursor-pointer bg-white dark:bg-[#13151f] border border-slate-200 dark:border-white/10 rounded-xl pl-3 pr-9 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none hover:bg-slate-50 dark:hover:bg-slate-800 focus:border-emerald-500 transition-colors shadow-sm"
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
              </div>
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
                      const clientName = clients.find((client) => client.id === contract.clientId)?.name ?? "Unknown";
                      return (
                        <tr key={contract.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 tracking-tight">{contract.title}</span>
                              <span className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                                {contract.reference}
                              </span>
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
                              <span>{new Date(`${contract.effectiveDate}T00:00:00`).toLocaleDateString()}</span>
                              <span className="text-slate-300">→</span>
                              <span>{new Date(`${contract.expiryDate}T00:00:00`).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                className="p-2 cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="View Document"
                                onClick={() => setPreviewContractId(contract.id)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                              <button
                                className="p-2 cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="Edit"
                                onClick={() => openEditModal(contract)}
                              >
                                <FileEdit className="h-4 w-4" />
                              </button>
                              {contract.status === "draft" ? (
                                <button
                                  className="p-2 cursor-pointer text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Send for Signature"
                                  onClick={() => updateContractStatus(contract.id, "sent")}
                                >
                                  <Send className="h-4 w-4" />
                                </button>
                              ) : contract.status === "sent" ? (
                                <button
                                  className="px-2 py-1 text-[11px] rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
                                  onClick={() => updateContractStatus(contract.id, "signed")}
                                >
                                  Mark Signed
                                </button>
                              ) : null}
                              <button
                                className="p-2 cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="Download Summary"
                                onClick={() => downloadContractSummary(contract)}
                              >
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
              {filteredContracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-800">No contracts found</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-[240px]">
                    We could not find agreements matching your current filters.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      
      {/* New/Edit Contract Modal */}
      <AnimatedModal isOpen={showCreateModal} onClose={closeModal}>
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">
              {editingContractId ? "Edit Contract" : "New Contract"}
            </h2>
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
                <p className="font-bold text-slate-800">
                  {editingContractId ? "Contract Updated!" : "Contract Created!"}
                </p>
                <p className="text-sm text-slate-400 mt-0.5">Changes saved in demo state</p>
              </div>
            </div>
          ) : (
            <form
              className="flex flex-col gap-4 px-6 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveContract();
              }}
            >
              <label className="block text-sm text-slate-600">
                Contract Title
                <input
                  type="text"
                  placeholder="e.g. Master Service Agreement"
                  className={inputCls}
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
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
                      onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
                      required
                    >
                      <option value="">Select client…</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  </div>
                </label>
                <label className="block text-sm text-slate-600">
                  Value (€)
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    className={inputCls}
                    value={form.value}
                    onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, effectiveDate: event.target.value }))}
                    required
                  />
                </label>
                <label className="block text-sm text-slate-600">
                  Expiry Date
                  <input
                    type="date"
                    className={inputCls}
                    value={form.expiryDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <label className="block text-sm text-slate-600">
                Reference ID <span className="text-slate-400 font-normal">(optional)</span>
                <input
                  type="text"
                  placeholder="e.g. MSA-2026-001"
                  className={inputCls}
                  value={form.reference}
                  onChange={(event) => setForm((prev) => ({ ...prev, reference: event.target.value }))}
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
                  {editingContractId ? "Save Changes" : "Save as Draft"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </AnimatedModal>

      {/* Preview Modal */}
      <AnimatedModal isOpen={!!previewContractId} onClose={() => setPreviewContractId(null)}>
        {previewContract && (
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/30">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{previewContract.title}</h3>
                <p className="text-xs text-slate-500">{previewContract.reference}</p>
              </div>
              <button
                type="button"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 transition-colors"
                onClick={() => setPreviewContractId(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6 text-sm text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Client</p>
                  <p className="font-semibold text-slate-800">
                    {clients.find((client) => client.id === previewContract.clientId)?.name ?? "Unknown"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Value</p>
                  <p className="font-bold text-emerald-600">{formatCurrency(previewContract.value)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Effective Date</p>
                  <p className="font-semibold text-slate-800">{previewContract.effectiveDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Expiry Date</p>
                  <p className="font-semibold text-slate-800">{previewContract.expiryDate}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Demo Disclaimer</p>
                <p className="text-xs text-slate-400 italic">
                  This frontend preview represents the active mock contract terms for demo walkthroughs. 
                  Actual PDF generation would occur in a production environment.
                </p>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>
    </>
  );
}
