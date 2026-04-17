"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { mockData } from "@/data/mock-data";
import {
  AppData,
  AutomationRule,
  AutomationRuleStatus,
  Contract,
  ContractStatus,
  Invoice,
  InvoiceStatus,
  Project,
  SupportTicket,
  SupportTicketStatus,
  TaskStatus,
  TimeLog,
} from "@/types/domain";

type OpsState = AppData & {
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  reassignTask: (taskId: string, assigneeId: string) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  addInvoice: (invoice: Omit<Invoice, "issueDate">) => void;
  addTimeLog: (log: Omit<TimeLog, "id">) => void;
  addProject: (project: Omit<Project, "id">) => void;
  addContract: (contract: Omit<Contract, "id">) => void;
  updateContract: (contractId: string, changes: Partial<Omit<Contract, "id">>) => void;
  updateContractStatus: (contractId: string, status: ContractStatus) => void;
  addAutomationRule: (
    rule: Omit<AutomationRule, "id" | "lastRunAt" | "successRate" | "impactLabel" | "status"> & {
      status?: AutomationRuleStatus;
      successRate?: number;
      impactLabel?: string;
    },
  ) => void;
  toggleAutomationRule: (ruleId: string) => void;
  updateAutomationRuleTemplate: (ruleId: string, template: string) => void;
  addSupportTicket: (
    ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string },
  ) => void;
  updateSupportTicketStatus: (ticketId: string, status: SupportTicketStatus) => void;
  assignSupportTicketOwner: (ticketId: string, ownerId: string) => void;
  resetDemoData: () => void;
};

export const useOpsStore = create<OpsState>()(
  persist(
    (set) => ({
      ...mockData,
      updateTaskStatus: (taskId, status) =>
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
        })),
      reassignTask: (taskId, assigneeId) =>
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, assigneeId } : task)),
        })),
      updateInvoiceStatus: (invoiceId, status) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === invoiceId ? { ...invoice, status } : invoice,
          ),
        })),
      addTimeLog: (log) =>
        set((state) => ({
          timeLogs: [
            ...state.timeLogs,
            {
              ...log,
              id: typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `log-${Date.now()}`,
            },
          ],
        })),
      addInvoice: (invoice) =>
        set((state) => ({
          invoices: [
            {
              ...invoice,
              issueDate: new Date().toISOString().split("T")[0],
            },
            ...state.invoices,
          ],
        })),
      addProject: (project) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              ...project,
              id: typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `proj-${Date.now()}`,
            },
          ],
        })),
      addContract: (contract) =>
        set((state) => ({
          contracts: [
            {
              ...contract,
              id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `cnt-${Date.now()}`,
            },
            ...state.contracts,
          ],
        })),
      updateContract: (contractId, changes) =>
        set((state) => ({
          contracts: state.contracts.map((contract) =>
            contract.id === contractId ? { ...contract, ...changes } : contract,
          ),
        })),
      updateContractStatus: (contractId, status) =>
        set((state) => ({
          contracts: state.contracts.map((contract) =>
            contract.id === contractId ? { ...contract, status } : contract,
          ),
        })),
      addAutomationRule: (rule) =>
        set((state) => ({
          automationRules: [
            {
              ...rule,
              id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `rule-${Date.now()}`,
              status: rule.status ?? "active",
              successRate: rule.successRate ?? 100,
              impactLabel: rule.impactLabel ?? "New workflow in demo mode",
              lastRunAt: new Date().toISOString(),
            },
            ...state.automationRules,
          ],
        })),
      toggleAutomationRule: (ruleId) =>
        set((state) => ({
          automationRules: state.automationRules.map((rule) =>
            rule.id === ruleId
              ? { ...rule, status: rule.status === "active" ? "paused" : "active" }
              : rule,
          ),
        })),
      updateAutomationRuleTemplate: (ruleId, template) =>
        set((state) => ({
          automationRules: state.automationRules.map((rule) =>
            rule.id === ruleId ? { ...rule, emailTemplate: template } : rule,
          ),
        })),
      addSupportTicket: (ticket) =>
        set((state) => ({
          supportTickets: [
            {
              ...ticket,
              id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `st-${Date.now()}`,
              createdAt: ticket.createdAt ?? new Date().toISOString(),
              updatedAt: ticket.updatedAt ?? new Date().toISOString(),
            },
            ...state.supportTickets,
          ],
        })),
      updateSupportTicketStatus: (ticketId, status) =>
        set((state) => ({
          supportTickets: state.supportTickets.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, status, updatedAt: new Date().toISOString() } : ticket,
          ),
        })),
      assignSupportTicketOwner: (ticketId, ownerId) =>
        set((state) => ({
          supportTickets: state.supportTickets.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, ownerId, updatedAt: new Date().toISOString() } : ticket,
          ),
        })),
      resetDemoData: () => set(() => ({ ...mockData })),
    }),
    {
      name: "ops-demo-store-v1",
      partialize: (state) => ({
        clients: state.clients,
        projects: state.projects,
        tasks: state.tasks,
        users: state.users,
        timeLogs: state.timeLogs,
        invoices: state.invoices,
        contracts: state.contracts,
        automationRules: state.automationRules,
        supportTickets: state.supportTickets,
      }),
    },
  ),
);
