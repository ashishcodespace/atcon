"use client";

import { create } from "zustand";

import { mockData } from "@/data/mock-data";
import { AppData, InvoiceStatus, Project, TaskStatus, TimeLog } from "@/types/domain";

type OpsState = AppData & {
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  reassignTask: (taskId: string, assigneeId: string) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  addTimeLog: (log: Omit<TimeLog, "id">) => void;
  addProject: (project: Omit<Project, "id">) => void;
};

export const useOpsStore = create<OpsState>((set) => ({
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
}));
