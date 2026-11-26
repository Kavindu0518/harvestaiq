import { Suspense } from "react";
import Link from "next/link";
import {
  OwnerPageSkeleton,
  OwnerShell,
} from "@/components/owner/owner-shell";
import { UserKpiCards } from "@/components/owner/user-kpi-cards";
import {
  computeUserDirectoryKpis,
  listAllDirectoryUsers,
} from "@/lib/admin-users";
import { requirePortalSession } from "@/lib/require-route-auth";

const OWNER_MODULES = [
  {
    title: "Staff & Access Governance",
    badge: "Administration",
    description:
      "Inspect all staff and buyer accounts, verify greenhouse assignments, and audit user role coverage.",
    href: "/owner/staff",
    cta: "Open Staff & Users",
  },
  {
    title: "Account Status Controls",
    badge: "Security",
    description:
      "Track pending email verifications, active operational staff, and suspended or inactive accounts.",
    href: "/owner/staff",
    cta: "Review Account Statuses",
  },
  {
    title: "Portfolio Yield & Financials",
    badge: "Executive",
    description:
      "Monitor estate-wide greenhouse coverage, buyer growth, and executive operational readiness.",
    href: "/owner/staff",
    cta: "View Directory Summary",
  },
];

async function OwnerOverviewContent() {
  const [user, directoryUsers] = await Promise.all([
    requirePortalSession("/owner"),
    listAllDirectoryUsers(),
  ]);

  const kpis = computeUserDirectoryKpis(directoryUsers);

  return (
    <OwnerShell activeNav="overview" user={user}>
      <div className="space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Owner / Administrator
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Owner &amp; Governance Console
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-100/90 sm:text-base">
                Oversee greenhouse portfolio performance, staff provisioning,
                account lifecycle controls, and platform security audit logs.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/owner/staff"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-xs transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Manage Staff &amp; Users →
                </Link>
                <Link
                  href="/owner/staff?create=true"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-300/60 bg-emerald-700/40 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  + Add Staff Member
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:min-w-[260px]">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-200">
                Signed in as
              </p>
              <p className="mt-1 truncate text-base font-semibold text-white">
                {user.name || "HarvestAIQ Owner"}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-emerald-100/80">
                  {user.email}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.assignedGreenhouses.map((gh) => (
                  <span
                    key={gh}
                    className="inline-flex rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium text-emerald-100"
                  >
                    {gh === "ALL" ? "ALL Greenhouses" : gh}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <UserKpiCards kpis={kpis} />

        <section aria-label="Owner governance modules">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Governance Modules
            </h2>
            <Link
              href="/owner/staff"
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View All Users
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {OWNER_MODULES.map((mod) => (
              <article
                key={mod.title}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
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

                <div className="mt-4 pt-2">
                  <Link
                    href={mod.href}
                    className="inline-flex min-h-[44px] items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    {mod.cta} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </OwnerShell>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<OwnerPageSkeleton />}>
      <OwnerOverviewContent />
    </Suspense>
  );
}
