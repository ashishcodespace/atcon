"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown, ClipboardList, FolderKanban, LayoutDashboard, Search, Users, Wallet, Menu, User as UserIcon, LogOut, X, Clock } from "lucide-react";
import clsx from "clsx";
import { ReactNode, useMemo, useState } from "react";
import LogoImage from "@/assets/logo.png";
import { useOpsStore } from "@/store/ops-store";
import { useShallow } from "zustand/react/shallow";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Timesheet", href: "/timesheet", icon: Clock },
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
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [hubDropdownOpen, setHubDropdownOpen] = useState(false);
  const [activeHub, setActiveHub] = useState("Internal Hub");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);
  const { clients, projects, tasks, invoices } = useOpsStore(
    useShallow((state) => ({
      clients: state.clients,
      projects: state.projects,
      tasks: state.tasks,
      invoices: state.invoices,
    })),
  );

  const searchResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) return [];
    const results = [
      ...clients
        .filter((client) => client.name.toLowerCase().includes(query))
        .map((client) => ({ id: `client-${client.id}`, label: client.name, hint: "Client", href: `/clients/${client.id}` })),
      ...projects
        .filter((project) => project.name.toLowerCase().includes(query))
        .map((project) => ({ id: `project-${project.id}`, label: project.name, hint: "Project", href: `/projects` })),
      ...tasks
        .filter((task) => task.title.toLowerCase().includes(query))
        .map((task) => ({ id: `task-${task.id}`, label: task.title, hint: "Task", href: `/tasks` })),
    ];
    return results.slice(0, 6);
  }, [clients, projects, tasks, globalSearch]);

  const notifications = useMemo(() => {
    const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue");
    const blockedTasks = tasks.filter((task) => task.status === "blocked");
    return [
      ...overdueInvoices.map((invoice) => ({
        id: `overdue-${invoice.id}`,
        message: `Invoice ${invoice.id.toUpperCase()} is overdue`,
        href: "/invoices?status=overdue",
      })),
      ...blockedTasks.map((task) => ({
        id: `blocked-${task.id}`,
        message: `Blocked task: ${task.title}`,
        href: "/tasks?filter=blocked",
      })),
    ].slice(0, 6);
  }, [invoices, tasks]);

  return (
    <div className="flex h-screen bg-transparent text-slate-800 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-slate-900/50 md:hidden transition-opacity duration-300",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "transition-[width] duration-300 ease-in-out border-r border-slate-200 bg-white flex flex-col z-50 overflow-hidden whitespace-nowrap",
          "fixed inset-y-0 left-0 md:static md:translate-x-0",
          isMobileOpen ? "translate-x-0 w-64 px-2 py-4 shadow-xl md:shadow-none" : "-translate-x-full md:translate-x-0 py-4",
          !isMobileOpen && isSidebarCollapsed ? "md:w-20 md:px-2" : "md:w-64 md:px-2"
        )}
      >
        <div className={clsx("transition-all duration-300", (!isMobileOpen && isSidebarCollapsed) ? "mb-4 px-0" : "mb-8 px-3")}>
          <img
            src={LogoImage.src}
            alt="Logo"
            className={clsx(
              "h-6 w-auto object-contain transition-all duration-300 shrink-0 md:block hidden",
              (!isMobileOpen && isSidebarCollapsed) ? "opacity-0 w-0 h-0" : "opacity-100 w-auto h-6"
            )}
          />

          {/* Mobile close button */}
          <button
            className="ml-auto md:hidden p-1 text-slate-500 rounded-lg hover:bg-slate-100"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-1 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={clsx(
                  "flex items-center rounded-xl transition-all duration-300",
                  (!isMobileOpen && isSidebarCollapsed)
                    ? "md:justify-center md:px-2 md:py-3 md:gap-0"
                    : "px-4 py-2.5 gap-4",
                  isActive ? "bg-slate-100 text-slate-700 font-bold shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-700",
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className={clsx("h-[18px] w-[18px] shrink-0", (!isMobileOpen && isSidebarCollapsed) ? "md:min-w-[1.2rem] md:min-h-[1.2rem]" : "")} />
                <span className={clsx(
                  "tracking-[-0.01em] transition-all duration-300 overflow-hidden",
                  (!isMobileOpen && isSidebarCollapsed) ? "md:opacity-0 md:w-0" : "opacity-100 w-auto"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/50 bg-white px-4 md:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Toggle Mobile Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo in header for Mobile */}
            <img src={LogoImage.src} alt="Logo" className="h-4 w-auto object-contain md:hidden shrink-0 ml-1" />

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Desktop Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative hidden md:flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-500 flex-1 max-w-lg transition-all focus-within:border-emerald-500/50 focus-within:bg-white focus-within:shadow-md focus-within:ring-4 focus-within:ring-emerald-500/5 group">
              <Search className="h-[18px] w-[18px] shrink-0 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search resources, clients, initiatives..."
                className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400 font-medium tracking-tight"
                aria-label="Search platform resources, clients, and initiatives"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
              />
              {searchResults.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => {
                        setGlobalSearch("");
                        router.push(result.href);
                      }}
                    >
                      <span className="text-sm text-slate-700">{result.label}</span>
                      <span className="text-xs text-slate-400">{result.hint}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-4 shrink-0">
            {/* Internal Hub Dropdown */}
            <div className="relative">
              <button
                className="hidden md:flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                type="button"
                onClick={() => setHubDropdownOpen(!hubDropdownOpen)}
              >
                {activeHub}
                <ChevronDown className={clsx("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", hubDropdownOpen && "rotate-180")} />
              </button>

              {hubDropdownOpen && (
                <div className="fixed inset-0 z-10 hidden md:block" onClick={() => setHubDropdownOpen(false)}></div>
              )}
              <div
                className={clsx(
                  "absolute right-0 top-full mt-2 w-40 z-20 rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/50 transition-all duration-200 origin-top-right",
                  hubDropdownOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                )}
              >
                <button
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => { setActiveHub("Internal Hub"); setHubDropdownOpen(false); }}
                >
                  Internal Hub
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => { setActiveHub("Client Portal"); setHubDropdownOpen(false); }}
                >
                  Client Portal
                </button>
              </div>
            </div>

            <button
              className="relative rounded-lg bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors"
              type="button"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 ? (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div className="absolute right-20 top-14 z-30 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Action Alerts</p>
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setNotificationsOpen(false);
                        router.push(item.href);
                      }}
                    >
                      {item.message}
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-3 text-sm text-slate-500">All clear. No urgent notifications.</p>
                )}
              </div>
            ) : null}

            {/* Profile Dropdown */}
            <div className="relative border-l border-slate-200 pl-2 md:pl-4">
              <button
                className="flex items-center gap-2 text-left focus:outline-none rounded-full md:rounded-lg md:p-1 md:-m-1 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 text-emerald-700 font-medium text-xs">
                  OL
                </div>
                <div className="hidden md:block text-sm">
                  <p className="font-medium text-slate-700 leading-tight">Ops Lead</p>
                  <p className="text-xs text-slate-500 leading-tight">Internal</p>
                </div>
                <ChevronDown className={clsx("h-3.5 w-3.5 text-slate-400  md:block transition-transform duration-200", profileDropdownOpen && "rotate-180")} />
              </button>

              {profileDropdownOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)}></div>
              )}
              <div
                className={clsx(
                  "absolute right-0 top-full mt-2 w-40 z-20 rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/50 transition-all duration-200 origin-top-right",
                  profileDropdownOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                )}
              >
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setShowProfileModal(true);
                  }}
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  Profile
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setShowLogoutMessage(true);
                    setTimeout(() => setShowLogoutMessage(false), 2500);
                  }}
                >
                  <LogOut className="h-4 w-4 text-slate-400" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        {showLogoutMessage ? (
          <div className="absolute right-6 top-20 z-40 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 shadow">
            Mock logout complete for demo.
          </div>
        ) : null}
        {showProfileModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Profile Summary</h3>
                <button type="button" className="rounded p-1 text-slate-400 hover:bg-slate-100" onClick={() => setShowProfileModal(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium text-slate-800">Role:</span> Ops Lead</p>
                <p><span className="font-medium text-slate-800">Workspace:</span> {activeHub}</p>
                <p><span className="font-medium text-slate-800">Status:</span> Demo mode active</p>
              </div>
            </div>
          </div>
        ) : null}
        <main className="min-h-0 flex-1 overflow-auto bg-slate-50/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
