"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown, ClipboardList, FolderKanban, LayoutDashboard, Search, Users, Wallet, Menu, User as UserIcon, LogOut, X, Clock } from "lucide-react";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import LogoImage from "@/assets/logo.png";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [hubDropdownOpen, setHubDropdownOpen] = useState(false);
  const [activeHub, setActiveHub] = useState("Internal Hub");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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
          "transition-all duration-300 ease-in-out border-r border-slate-200 bg-white flex flex-col z-50 overflow-hidden whitespace-nowrap",
          "fixed inset-y-0 left-0 md:static md:translate-x-0",
          isMobileOpen ? "translate-x-0 w-64 px-2 py-4 shadow-xl md:shadow-none" : "-translate-x-full md:translate-x-0 py-4",
          !isMobileOpen && isSidebarCollapsed ? "md:w-16 md:px-2" : "md:w-64 md:px-2"
        )}
      >
        <div className={clsx("mb-8 flex items-center gap-2", (!isMobileOpen && isSidebarCollapsed) ? "justify-center" : "px-3")}>
          <img src={LogoImage.src} alt="Logo" className="h-6 w-auto object-contain object-left shrink-0 md:block hidden" />

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
                  "flex items-center rounded-xl px-3 py-2 text-sm transition-colors",
                  (!isMobileOpen && isSidebarCollapsed) ? "md:justify-center" : "gap-3",
                  isActive ? "bg-slate-100 text-slate-700 shadow-sm shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100",
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className={clsx("h-4 w-4", (!isMobileOpen && isSidebarCollapsed) ? "md:min-w-[1rem] md:min-h-[1rem]" : "")} />
                <span className={clsx((!isMobileOpen && isSidebarCollapsed) ? "md:hidden truncate" : "")}>{item.label}</span>
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
              className="hidden md:block p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Desktop Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 flex-1 max-w-md transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:shadow-sm focus-within:ring-1 focus-within:ring-emerald-500">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients, projects..."
                className="bg-transparent outline-none w-full text-slate-700 placeholder-slate-400"
              />
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

            <button className="relative rounded-lg bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors" type="button" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

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
                  "absolute right-0 top-full mt-2 w-48 z-20 rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/50 transition-all duration-200 origin-top-right",
                  profileDropdownOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                )}
              >
                <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer" onClick={() => setProfileDropdownOpen(false)}>
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  Profile
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer" onClick={() => setProfileDropdownOpen(false)}>
                  <LogOut className="h-4 w-4 text-slate-400" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto bg-slate-50/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
