import { Suspense } from "react";
import Link from "next/link";
import {
  OwnerPageSkeleton,
  OwnerShell,
} from "@/components/owner/owner-shell";
import { UserDirectoryClient } from "@/components/owner/user-directory-client";
import { listAllDirectoryUsers } from "@/lib/admin-users";
import { requirePortalSession } from "@/lib/require-route-auth";

async function OwnerStaffDirectoryContent({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const [user, directoryUsers, resolvedParams] = await Promise.all([
    requirePortalSession("/owner/staff"),
    listAllDirectoryUsers(),
    searchParams,
  ]);

  const openCreateModal = resolvedParams.create === "true";

  return (
    <OwnerShell activeNav="staff" user={user}>
      <div className="space-y-6">
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Owner Administration
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Staff &amp; User Directory
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Search, filter, provision staff accounts, and manage user access
              statuses.
            </p>
          </div>

          <Link
            href="/owner"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            ← Back to Overview
          </Link>
        </section>

        <UserDirectoryClient
          initialUsers={directoryUsers}
          currentUserId={user.id}
          initialOpenCreateModal={openCreateModal}
        />
      </div>
    </OwnerShell>
  );
}

export default function OwnerStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  return (
    <Suspense fallback={<OwnerPageSkeleton showTable />}>
      <OwnerStaffDirectoryContent searchParams={searchParams} />
    </Suspense>
  );
}
