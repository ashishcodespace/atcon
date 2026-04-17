"use client";

import Link from "next/link";
import { Columns3, Download, Search, SlidersHorizontal, ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { StatStrip } from "@/components/shared/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/ops-logic";
import { useOpsStore } from "@/store/ops-store";
import { useShallow } from "zustand/react/shallow";

export default function ClientsPage() {
  const { clients, projects, invoices } = useOpsStore(
    useShallow((state) => ({
      clients: state.clients,
      projects: state.projects,
      invoices: state.invoices,
    })),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [healthFilter, setHealthFilter] = useState<"all" | "healthy" | "watch" | "at_risk">("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "pending_desc" | "projects_desc">("name_asc");
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    industry: true,
    billing: true,
    pending: true,
  });

  const rows = useMemo(
    () =>
      clients.map((client) => {
        const clientProjects = projects.filter((project) => project.clientId === client.id);
        const pending = invoices
          .filter((invoice) => invoice.clientId === client.id && invoice.status !== "paid")
          .reduce((sum, invoice) => sum + invoice.amount, 0);
        return {
          ...client,
          projectCount: clientProjects.length,
          pending,
        };
      }),
    [clients, projects, invoices],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = rows.filter((client) => {
      const passesHealth = healthFilter === "all" ? true : client.health === healthFilter;
      const matchesQuery =
        !normalizedQuery ||
        client.name.toLowerCase().includes(normalizedQuery) ||
        client.industry.toLowerCase().includes(normalizedQuery) ||
        client.billingEmail.toLowerCase().includes(normalizedQuery);
      return passesHealth && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "pending_desc") return b.pending - a.pending;
      if (sortBy === "projects_desc") return b.projectCount - a.projectCount;
      return a.name.localeCompare(b.name);
    });
  }, [rows, searchQuery, healthFilter, sortBy]);

  const exportRows = () => {
    const csvHeader = ["Client", "Industry", "Projects", "Rate", "Billing Email", "Health", "Pending Amount"];
    const csvLines = filteredRows.map((client) =>
      [
        client.name,
        client.industry,
        client.projectCount,
        client.hourlyRate,
        client.billingEmail,
        client.health,
        client.pending,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );

    const csvContent = [csvHeader.join(","), ...csvLines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clients-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeClients = rows.filter((client) => client.health !== "at_risk").length;
  const onboardingClients = rows.filter((client) => client.health === "watch").length;
  const totalRevenue = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const avgProjectValue = rows.length ? Math.round(projects.reduce((sum, project) => sum + project.budget, 0) / rows.length) : 0;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
      </div>

      <StatStrip
        stats={[
          { label: "Total Clients", value: String(rows.length) },
          { label: "Active", value: String(activeClients), valueTone: "success" },
          { label: "Onboarding", value: String(onboardingClients), valueTone: "warning" },
          { label: "Total Revenue", value: formatCurrency(totalRevenue), valueTone: "success" },
          { label: "Avg Project Value", value: formatCurrency(avgProjectValue) },
        ]}
      />

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Client Directory</CardTitle>
            
            {/* Mobile Filters */}
            <div className="flex sm:hidden items-center gap-0.5">
              <div className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
                <select
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  value={healthFilter}
                  onChange={(event) => setHealthFilter(event.target.value as typeof healthFilter)}
                >
                  <option value="all">All health</option>
                  <option value="healthy">Healthy</option>
                  <option value="watch">Watch</option>
                  <option value="at_risk">At risk</option>
                </select>
              </div>
              <div className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-500">
                <ArrowDownUp className="h-4 w-4" />
                <select
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                >
                  <option value="name_asc">Name</option>
                  <option value="pending_desc">Pending amount</option>
                  <option value="projects_desc">Projects</option>
                </select>
              </div>
              <div className="relative">
                <button type="button" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" onClick={() => setShowColumnsMenu((prev) => !prev)}>
                  <Columns3 className="h-4 w-4" />
                </button>
                {showColumnsMenu ? (
                  <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d27] p-2 shadow-lg">
                    {(
                      [
                        ["industry", "Industry"],
                        ["billing", "Billing"],
                        ["pending", "Pending amount"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={visibleColumns[key]}
                          onChange={(event) =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [key]: event.target.checked,
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" onClick={exportRows}>
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center w-full sm:w-auto gap-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13151f] px-3 py-2.5 sm:py-2 text-sm text-slate-500 dark:text-slate-400">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full sm:w-52 bg-transparent outline-none placeholder:text-slate-400 dark:text-slate-200"
                placeholder="Search clients..."
              />
            </div>
            <div className="hidden sm:flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13151f] px-2 py-1">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <select
                  className="bg-transparent text-xs text-slate-700 outline-none w-auto pr-6"
                  value={healthFilter}
                  onChange={(event) => setHealthFilter(event.target.value as typeof healthFilter)}
                >
                  <option value="all">All health</option>
                  <option value="healthy">Healthy</option>
                  <option value="watch">Watch</option>
                  <option value="at_risk">At risk</option>
                </select>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13151f] px-2 py-1">
                <ArrowDownUp className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-500 hidden sm:inline">Sort</span>
                <select
                  className="bg-transparent text-xs text-slate-700 outline-none"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                >
                  <option value="name_asc">Name</option>
                  <option value="pending_desc">Pending amount</option>
                  <option value="projects_desc">Projects</option>
                </select>
              </div>
              <div className="relative">
                <Button variant="ghost" className="gap-1.5 text-xs px-3" onClick={() => setShowColumnsMenu((prev) => !prev)}>
                  <Columns3 className="h-3.5 w-3.5" />
                  <span>Columns</span>
                </Button>
                {showColumnsMenu ? (
                  <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d27] p-2 shadow-lg">
                    {(
                      [
                        ["industry", "Industry"],
                        ["billing", "Billing"],
                        ["pending", "Pending amount"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 px-1 py-1 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={visibleColumns[key]}
                          onChange={(event) =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [key]: event.target.checked,
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
              <Button variant="ghost" className="gap-1.5 text-xs px-3" onClick={exportRows}>
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={filteredRows}
            columns={[
              {
                key: "name",
                title: "Client",
                render: (client) => (
                  <div>
                    <p className="font-medium text-slate-800">{client.name}</p>
                    <p className="text-xs text-slate-500">{client.industry}</p>
                  </div>
                ),
              },
              {
                key: "projects",
                title: "Projects",
                render: (client) => client.projectCount,
              },
              { key: "rate", title: "Rate", render: (client) => `${formatCurrency(client.hourlyRate)}/h` },
              ...(visibleColumns.industry
                ? [
                    {
                      key: "industry",
                      title: "Industry",
                      render: (client: (typeof filteredRows)[number]) => client.industry,
                    },
                  ]
                : []),
              ...(visibleColumns.billing
                ? [
                    {
                      key: "billing",
                      title: "Billing",
                      render: (client: (typeof filteredRows)[number]) => client.billingEmail,
                    },
                  ]
                : []),
              {
                key: "health",
                title: "Health",
                render: (client) => (
                  <Badge
                    label={client.health.replace("_", " ")}
                    tone={client.health === "at_risk" ? "danger" : client.health === "watch" ? "warning" : "success"}
                  />
                ),
              },
              ...(visibleColumns.pending
                ? [
                    {
                      key: "pending",
                      title: "Pending Amount",
                      render: (client: (typeof filteredRows)[number]) => (
                        <span className={client.pending > 0 ? "text-rose-700" : "text-slate-500"}>
                          {formatCurrency(client.pending)}
                        </span>
                      ),
                    },
                  ]
                : []),
              {
                key: "details",
                title: "",
                render: (client) => (
                  <Link href={`/clients/${client.id}`} className="text-xs font-medium text-slate-700 hover:text-slate-900">
                    View details
                  </Link>
                ),
              },
            ]}
            emptyMessage="No clients match your filters."
          />
        </CardContent>
      </Card>
    </section>
  );
}
