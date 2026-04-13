export type ProjectStatus = "active" | "completed" | "delayed";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Client = {
  id: string;
  name: string;
  industry: string;
  billingEmail: string;
  hourlyRate: number;
  health: "healthy" | "watch" | "at_risk";
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  status: ProjectStatus;
  budget: number;
  progress: number;
  startDate: string;
  endDate: string;
};

export type User = {
  id: string;
  name: string;
  role: string;
  capacityHours: number;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: number;
};

export type TimeLog = {
  id: string;
  projectId: string;
  taskId: string;
  userId: string;
  date: string;
  hours: number;
  billable: boolean;
};

export type Invoice = {
  id: string;
  clientId: string;
  projectId: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
};

export type AppData = {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  users: User[];
  timeLogs: TimeLog[];
  invoices: Invoice[];
};
