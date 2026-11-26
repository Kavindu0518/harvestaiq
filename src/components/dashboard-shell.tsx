import Link from "next/link";
import type { Role } from "@prisma/client";
import { signOutAction } from "@/app/actions/signout";
import { BrandLogo } from "./brand-logo";

const ROLE_LABELS: Record<Role, string> = {
  OWNER_ADMIN: "Owner / Administrator",
  FARM_MANAGER: "Farm Manager",
  AGRONOMIST: "Agronomist",
  GREENHOUSE_TECH: "Greenhouse Technician",
  BUYER: "Verified Buyer",
};

interface DashboardNavLink {
  href: string;
  label: string;
}

interface DashboardModule {
  title: string;
  description: string;
  badge: string;
}

interface DashboardShellProps {
  portalTitle: string;
  portalSubtitle: string;
  user: {
    name?: string | null;
    email?: string | null;
    userCode: string;
    role: Role;
    assignedGreenhouses: string[];
  };
  navLinks?: DashboardNavLink[];
  modules: DashboardModule[];
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-emerald-50/40 flex flex-col">
      <header className="border-b border-emerald-100 bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo href="/" />
          <div className="h-11 w-28 animate-pulse rounded-xl bg-emerald-100" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="h-44 animate-pulse rounded-2xl bg-emerald-900/15" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-emerald-100 bg-white"
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export function DashboardShell({
  portalTitle,
  portalSubtitle,
  user,
  navLinks = [],
  modules,
}: DashboardShellProps) {
  const greenhouses =
    user.assignedGreenhouses.length > 0 ? user.assignedGreenhouses : [];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-emerald-50/40 flex flex-col">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo href="/" />

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex min-h-[36px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs font-semibold text-emerald-800">
              {user.userCode}
            </span>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>

        {navLinks.length > 0 ? (
          <nav
            aria-label="Portal navigation"
            className="border-t border-emerald-100/80 bg-emerald-50/50"
          >
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-[44px] items-center rounded-lg px-3.5 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100/80 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                {ROLE_LABELS[user.role]}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {portalTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-100/90 sm:text-base">
                {portalSubtitle}
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:min-w-[260px]">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-200">
                Signed in as
              </p>
              <p className="mt-1 truncate text-base font-semibold text-white">
                {user.name || "HarvestAIQ User"}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-emerald-100/80">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section
          aria-label="Account summary"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Account Name
            </p>
            <p className="mt-2 truncate text-lg font-bold text-slate-900">
              {user.name || "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              User Code
            </p>
            <p className="mt-2 font-mono text-lg font-bold text-emerald-700">
              {user.userCode}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Role
            </p>
            <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              {user.role}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Greenhouses
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {greenhouses.length > 0 ? (
                greenhouses.map((gh) => (
                  <span
                    key={gh}
                    className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {gh === "ALL" ? "ALL Greenhouses" : gh}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">None assigned</span>
              )}
            </div>
          </div>
        </section>

        <section aria-label="Portal modules" className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Workspace Modules
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <article
                key={mod.title}
                className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                    {mod.badge}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-slate-900">
                    {mod.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {mod.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
