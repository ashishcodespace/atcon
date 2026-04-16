"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { mockData } from "@/data/mock-data";
import { AppData, Invoice, InvoiceStatus, Project, TaskStatus, TimeLog } from "@/types/domain";

type OpsState = AppData & {
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  reassignTask: (taskId: string, assigneeId: string) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  addInvoice: (invoice: Omit<Invoice, "issueDate">) => void;
  addTimeLog: (log: Omit<TimeLog, "id">) => void;
  addProject: (project: Omit<Project, "id">) => void;
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
      }),
    },
  ),
);
