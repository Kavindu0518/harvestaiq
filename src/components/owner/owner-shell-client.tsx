"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Menu,
  Sprout,
  Store,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export type OwnerNavKey = "overview" | "staff";

interface OwnerUserSummary {
  name?: string | null;
  email?: string | null;
  userCode: string;
}

interface OwnerShellClientProps {
  activeNav: OwnerNavKey;
  user: OwnerUserSummary;
  signOutSlot: ReactNode;
  children: ReactNode;
}

const PRIMARY_NAV = [
  {
    key: "overview" as const,
    href: "/owner",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    key: "staff" as const,
    href: "/owner/staff",
    label: "Staff & Users",
    icon: Users,
  },
];

const UPCOMING_NAV = [
  { label: "Greenhouses", icon: Sprout },
  { label: "Crop Telemetry", icon: Activity },
  { label: "Marketplace", icon: Store },
  { label: "Audit Logs", icon: FileText },
];

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "OA").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function SidebarNavContent({
  activeNav,
  user,
  collapsed,
  onNavigate,
}: {
  activeNav: OwnerNavKey;
  user: OwnerUserSummary;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const initials = getInitials(user.name, user.email);

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        <div>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Governance
            </p>
          ) : null}
          <ul className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeNav;

              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                      collapsed ? "justify-center px-2" : ""
                    } ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Operations Suite
            </p>
          ) : null}
          <ul className="space-y-1">
            {UPCOMING_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <div
                    aria-disabled="true"
                    title={collapsed ? `${item.label} (Coming soon)` : undefined}
                    className={`flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 select-none ${
                      collapsed ? "justify-center px-2" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {!collapsed ? (
                        <span className="truncate">{item.label}</span>
                      ) : null}
                    </span>
                    {!collapsed ? (
                      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Soon
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200/80 pt-4">
        <div
          className={`flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-emerald-50">
            {initials}
          </span>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">
                {user.name || "Owner Admin"}
              </p>
              {user.email ? (
                <p className="truncate text-[11px] text-slate-500">
                  {user.email}
                </p>
              ) : null}
              <p className="mt-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                {user.userCode}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function OwnerShellClient({
  activeNav,
  user,
  signOutSlot,
  children,
}: OwnerShellClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!mobileDrawerOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  const pageHeading =
    activeNav === "overview" ? "Owner Overview" : "Staff & User Directory";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 flex">
      {/* Desktop Fixed Collapsible Left Sidebar (1024px+) */}
      <aside
        aria-label="Owner sidebar navigation"
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 border-r border-slate-200/80 bg-white transition-[width] duration-200 ${
          sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[240px]"
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-slate-200/80 px-3 ${
            sidebarCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!sidebarCollapsed ? (
            <BrandLogo href="/owner" />
          ) : (
            <Link
              href="/owner"
              aria-label="HarvestAIQ Owner Home"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs"
            >
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNavContent
            activeNav={activeNav}
            user={user}
            collapsed={sidebarCollapsed}
          />
        </div>

        <div className="border-t border-slate-200/80 p-2.5">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
          sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[240px]"
        }`}
      >
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileDrawerOpen}
                className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 lg:hidden cursor-pointer"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="lg:hidden">
                <BrandLogo href="/owner" />
              </div>

              <div className="hidden lg:flex lg:items-center lg:gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Owner Console
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  /
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {pageHeading}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-flex min-h-[36px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs font-semibold text-emerald-800">
                {user.userCode}
              </span>
              {signOutSlot}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>

      {/* Mobile / Tablet Slide-over Navigation Drawer (<1024px) */}
      {mobileDrawerOpen ? (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation drawer"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 flex h-full w-[280px] max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
              <BrandLogo href="/owner" />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-[44px] w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarNavContent
                activeNav={activeNav}
                user={user}
                collapsed={false}
                onNavigate={() => setMobileDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
