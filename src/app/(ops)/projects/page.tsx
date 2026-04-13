import { ProjectsPageClient } from "@/components/pages/projects-page";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  return <ProjectsPageClient filter={filter} />;
}
