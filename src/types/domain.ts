export type ProjectStatus = "active" | "completed" | "delayed";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type ContractStatus = "draft" | "sent" | "signed" | "expired";
export type AutomationRuleType = "trigger" | "scheduled" | "alert";
export type AutomationRuleStatus = "active" | "paused";
export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

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
  managerId?: string;
  description?: string;
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

export type Contract = {
  id: string;
  title: string;
  clientId: string;
  value: number;
  status: ContractStatus;
  effectiveDate: string;
  expiryDate: string;
  reference: string;
};

export type AutomationRule = {
  id: string;
  name: string;
  description: string;
  type: AutomationRuleType;
  status: AutomationRuleStatus;
  trigger: string;
  action: string;
  lastRunAt: string;
  successRate: number;
  impactLabel: string;
  emailTemplate: string;
};

export type SupportTicket = {
  id: string;
  title: string;
  clientId: string;
  projectId?: string;
  ownerId: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  channel: "email" | "portal" | "call";
  category: "bug" | "billing" | "access" | "question" | "feature";
  createdAt: string;
  updatedAt: string;
  firstResponseMinutes: number;
  description: string;
};

export type AppData = {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  users: User[];
  timeLogs: TimeLog[];
  invoices: Invoice[];
  contracts: Contract[];
  automationRules: AutomationRule[];
  supportTickets: SupportTicket[];
};
