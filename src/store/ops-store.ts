"use client";

import { create } from "zustand";

import { mockData } from "@/data/mock-data";
import { AppData, InvoiceStatus, TaskStatus } from "@/types/domain";

type OpsState = AppData & {
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  reassignTask: (taskId: string, assigneeId: string) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
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
}));
