"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown, ClipboardList, FolderKanban, LayoutDashboard, Search, Users, Wallet } from "lucide-react";
import clsx from "clsx";
import { ReactNode } from "react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: BriefcaseBusiness },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: ClipboardList },
  { label: "Resources", href: "/resources", icon: Users },
  { label: "Invoices", href: "/invoices", icon: Wallet },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-transparent text-slate-800">
      <aside className="w-64 border-r border-white/50 bg-white/65 px-2 py-4 backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500" />
          <div>
            <p className="text-sm font-semibold">Operations Hub</p>
            <p className="text-xs text-slate-500">Unified Prototype</p>
          </div>
        </div>

        <nav className="space-y-1 px-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-emerald-500 text-white" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-white/50 bg-white/65 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/75 px-3 py-2 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            Search clients, projects, invoices...
          </div>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 rounded-lg border border-white/60 bg-white/70 px-2.5 py-1.5 text-xs text-slate-600 backdrop-blur-sm hover:bg-white"
              type="button"
            >
              Internal Hub
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button className="rounded-lg border border-white/60 bg-white/70 p-2 text-slate-600 backdrop-blur-sm hover:bg-white" type="button" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-300" />
              <div className="text-sm">
                <p className="font-medium text-slate-700">Ops Lead</p>
                <p className="text-xs text-slate-500">Internal</p>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
