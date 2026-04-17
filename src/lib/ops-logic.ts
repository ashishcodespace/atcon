import { AppData, Invoice, Project, Task, User } from "@/types/domain";

type MetricsData = Pick<AppData, "projects" | "invoices" | "tasks" | "users">;
type InsightsData = Pick<AppData, "projects" | "invoices" | "tasks" | "users" | "timeLogs">;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

export const isOverdue = (date: string) => new Date(date) < new Date();

export const getProjectRiskScore = (project: Project, tasks: Task[], invoices: Invoice[]) => {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const blockedCount = projectTasks.filter((task) => task.status === "blocked").length;
  const highPriorityCount = projectTasks.filter((task) => task.priority === "critical").length;
  const overdueInvoices = invoices.filter(
    (invoice) => invoice.projectId === project.id && invoice.status === "overdue",
  ).length;

  let score = 0;
  if (project.status === "delayed") score += 2;
  if (blockedCount > 0) score += 2;
  if (highPriorityCount > 0) score += 1;
  if (overdueInvoices > 0) score += 2;
  if (project.progress < 50) score += 1;
  return score;
};

export const getUserLoad = (user: User, tasks: Task[]) => {
  const assigned = tasks.filter((task) => task.assigneeId === user.id && task.status !== "done");
  const hours = assigned.reduce((total, task) => total + task.estimatedHours, 0);
  const utilization = Math.round((hours / user.capacityHours) * 100);
  return {
    taskCount: assigned.length,
    hours,
    utilization,
  };
};

export const getDashboardMetrics = (data: MetricsData) => {
  const activeProjects = data.projects.filter((project) => project.status === "active").length;
  const pendingInvoices = data.invoices.filter(
    (invoice) => invoice.status === "sent" || invoice.status === "overdue",
  );
  const revenue = data.invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const tasksDue = data.tasks.filter((task) => {
    const dueInMs = new Date(task.dueDate).getTime() - Date.now();
    return dueInMs <= 1000 * 60 * 60 * 24 * 4 && task.status !== "done";
  }).length;
  const teamUtilization = Math.round(
    data.users.reduce((total, user) => total + getUserLoad(user, data.tasks).utilization, 0) /
      data.users.length,
  );

  return {
    activeProjects,
    pendingInvoices: pendingInvoices.length,
    revenue,
    tasksDue,
    teamUtilization,
  };
};

export const getOperationalInsights = (data: InsightsData) => {
  const atRiskProjects = data.projects
    .map((project) => ({
      ...project,
      riskScore: getProjectRiskScore(project, data.tasks, data.invoices),
    }))
    .filter((project) => project.riskScore >= 4)
    .sort((a, b) => b.riskScore - a.riskScore);

  const overloadedUsers = data.users
    .map((user) => ({ user, load: getUserLoad(user, data.tasks) }))
    .filter((item) => item.load.utilization > 90)
    .sort((a, b) => b.load.utilization - a.load.utilization);

  const overdueInvoices = data.invoices.filter((invoice) => invoice.status === "overdue");
  const billableHours = data.timeLogs.filter((log) => log.billable).reduce((sum, log) => sum + log.hours, 0);
  const revenuePipeline = data.invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "draft")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const forecastRevenue = Math.round(revenuePipeline + billableHours * 120);

  return {
    atRiskProjects,
    overloadedUsers,
    overdueInvoices,
    billableHours,
    forecastRevenue,
  };
};
