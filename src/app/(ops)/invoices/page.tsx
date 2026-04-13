import { InvoicesPageClient } from "@/components/pages/invoices-page";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return <InvoicesPageClient statusFilter={status} />;
}
