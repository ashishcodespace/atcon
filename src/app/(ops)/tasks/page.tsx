import { TasksPageClient } from "@/components/pages/tasks-page";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  return <TasksPageClient filter={filter} />;
}
