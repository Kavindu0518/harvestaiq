"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import type { AccountStatus, Role } from "@prisma/client";
import type { AdminDirectoryUser } from "@/lib/admin-users";
import { computeUserDirectoryKpis } from "@/lib/admin-users";
import { UserKpiCards } from "./user-kpi-cards";
import { CreateStaffModal } from "./create-staff-modal";
import {
  UserStatusActions,
  type ManageableStatus,
} from "./user-status-actions";

type RoleFilter = "ALL" | Role;
type StatusFilter = "ALL" | AccountStatus;
type GreenhouseFilter = "ALL_FILTER" | string;

const ROLE_OPTIONS: readonly { value: RoleFilter; label: string }[] = [
  { value: "ALL", label: "All Roles" },
  { value: "OWNER_ADMIN", label: "Owner Admin" },
  { value: "FARM_MANAGER", label: "Farm Manager" },
  { value: "AGRONOMIST", label: "Agronomist" },
  { value: "GREENHOUSE_TECH", label: "Greenhouse Tech" },
  { value: "BUYER", label: "Buyer" },
];

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "ALL" },
  { value: "PENDING", label: "PENDING" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SUSPENDED", label: "SUSPENDED" },
  { value: "INACTIVE", label: "INACTIVE" },
];

const DEFAULT_GREENHOUSES = ["ALL", "GH-01", "GH-02", "GH-03", "GH-04"];

const ROLE_BADGE_STYLES: Record<
  Role,
  { label: string; badgeClass: string; avatarClass: string }
> = {
  OWNER_ADMIN: {
    label: "OWNER_ADMIN",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    avatarClass: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  },
  FARM_MANAGER: {
    label: "FARM_MANAGER",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    avatarClass: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  },
  AGRONOMIST: {
    label: "AGRONOMIST",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    avatarClass: "bg-teal-100 text-teal-800 ring-1 ring-teal-200",
  },
  GREENHOUSE_TECH: {
    label: "GREENHOUSE_TECH",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    avatarClass: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  },
  BUYER: {
    label: "BUYER",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    avatarClass: "bg-purple-100 text-purple-800 ring-1 ring-purple-200",
  },
};

const STATUS_BADGE_STYLES: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "ACTIVE",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  PENDING: {
    label: "PENDING",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  SUSPENDED: {
    label: "SUSPENDED",
    className: "bg-rose-50 text-rose-800 border-rose-200",
  },
  INACTIVE: {
    label: "INACTIVE",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Colombo",
});

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return DATE_FORMATTER.format(parsed);
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || "HQ").toUpperCase();
}

function GreenhouseTags({ greenhouses }: { greenhouses: string[] }) {
  if (greenhouses.length === 0) {
    return <span className="text-xs text-slate-400">None assigned</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {greenhouses.map((gh) => (
        <span
          key={gh}
          className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
        >
          {gh}
        </span>
      ))}
    </div>
  );
}

function EmailVerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
      <span aria-hidden="true">✓</span>
      <span>Verified</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/80">
      <span aria-hidden="true">•</span>
      <span>Unverified</span>
    </span>
  );
}

interface UserDirectoryClientProps {
  initialUsers: AdminDirectoryUser[];
  currentUserId: string;
  initialOpenCreateModal?: boolean;
}

export function UserDirectoryClient({
  initialUsers,
  currentUserId,
  initialOpenCreateModal = false,
}: UserDirectoryClientProps) {
  const router = useRouter();

  const [users, setUsers] = useState<AdminDirectoryUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [greenhouseFilter, setGreenhouseFilter] =
    useState<GreenhouseFilter>("ALL_FILTER");

  const [createModalOpen, setCreateModalOpen] = useState(
    initialOpenCreateModal
  );
  const [banner, setBanner] = useState<{
    tone: "emerald" | "rose";
    text: string;
  } | null>(null);

  const [pendingStatusAction, setPendingStatusAction] = useState<{
    user: AdminDirectoryUser;
    nextStatus: ManageableStatus;
  } | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const kpis = useMemo(() => computeUserDirectoryKpis(users), [users]);

  const greenhouseOptions = useMemo(() => {
    const unique = new Set<string>(DEFAULT_GREENHOUSES);
    for (const user of users) {
      for (const gh of user.assignedGreenhouses) {
        if (gh.trim()) unique.add(gh.trim());
      }
    }
    return Array.from(unique);
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && user.accountStatus !== statusFilter) {
        return false;
      }

      if (greenhouseFilter !== "ALL_FILTER") {
        if (!user.assignedGreenhouses.includes(greenhouseFilter)) {
          return false;
        }
      }

      if (query.length > 0) {
        const matchesName = user.name.toLowerCase().includes(query);
        const matchesEmail = user.email.toLowerCase().includes(query);
        const matchesCode = user.userCode.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesCode) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, searchQuery, statusFilter, greenhouseFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    greenhouseFilter !== "ALL_FILTER";

  function clearFilters() {
    setSearchQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setGreenhouseFilter("ALL_FILTER");
  }

  function handleStaffCreated(createdUser: AdminDirectoryUser) {
    setUsers((prev) => [createdUser, ...prev]);
    setCreateModalOpen(false);
    setBanner({
      tone: "emerald",
      text: `Staff account created for ${createdUser.name} (${createdUser.userCode}). Verification email sent — status will remain PENDING until verified.`,
    });
    router.refresh();
  }

  async function executeStatusUpdate(
    targetUser: AdminDirectoryUser,
    nextStatus: ManageableStatus
  ) {
    setUpdatingUserId(targetUser.id);
    setBanner(null);

    try {
      const response = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountStatus: nextStatus,
          isActive: nextStatus === "ACTIVE",
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: {
          id: string;
          accountStatus: AccountStatus;
          isActive: boolean;
        };
      };

      if (!response.ok || !data.user) {
        setBanner({
          tone: "rose",
          text: data.error || "Unable to update account status.",
        });
        return;
      }

      setUsers((prev) =>
        prev.map((item) =>
          item.id === targetUser.id
            ? {
                ...item,
                accountStatus: data.user!.accountStatus,
                isActive: data.user!.isActive,
              }
            : item
        )
      );

      setBanner({
        tone: "emerald",
        text: `Updated ${targetUser.name} (${targetUser.userCode}) status to ${data.user.accountStatus}.`,
      });
      setPendingStatusAction(null);
      router.refresh();
    } catch {
      setBanner({
        tone: "rose",
        text: "Network error occurred while updating user status.",
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  function handleRequestStatusChange(
    targetUser: AdminDirectoryUser,
    nextStatus: ManageableStatus
  ) {
    if (nextStatus === "SUSPENDED" || nextStatus === "INACTIVE") {
      setPendingStatusAction({ user: targetUser, nextStatus });
      return;
    }

    void executeStatusUpdate(targetUser, nextStatus);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Staff Provisioning &amp; Lifecycle Controls
          </h2>
          <p className="text-xs text-slate-500">
            Create staff accounts or activate, suspend, and deactivate directory
            users.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer sm:w-auto"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {banner ? (
        <div
          role={banner.tone === "rose" ? "alert" : "status"}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xs ${
            banner.tone === "emerald"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <p className="font-medium">{banner.text}</p>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="inline-flex min-h-[44px] items-center rounded-lg px-2.5 text-xs font-semibold underline-offset-2 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <UserKpiCards kpis={kpis} />

      <section
        aria-label="Search and filter users"
        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <label
              htmlFor="directory-search"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Search Directory
            </label>
            <div className="relative flex items-center">
              <Search
                className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="directory-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or HAIQ- code..."
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white py-2.5 pr-3.5 pl-10 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 sm:text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="directory-role-filter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Role
            </label>
            <select
              id="directory-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 sm:text-sm"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="directory-greenhouse-filter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Greenhouse
            </label>
            <select
              id="directory-greenhouse-filter"
              value={greenhouseFilter}
              onChange={(e) =>
                setGreenhouseFilter(e.target.value as GreenhouseFilter)
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 sm:text-sm"
            >
              <option value="ALL_FILTER">All Greenhouses</option>
              {greenhouseOptions.map((gh) => (
                <option key={gh} value={gh}>
                  {gh === "ALL" ? "ALL (Global Access)" : gh}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Account status filter pills"
          >
            {STATUS_OPTIONS.map((option) => {
              const selected = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={selected}
                  className={`inline-flex min-h-[44px] items-center rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    selected
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-medium text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">{users.length}</span>{" "}
              accounts
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">
            No matching users found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search query, role, greenhouse, or account status
            filter.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              Reset All Filters
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {/* Desktop Table View (1024px+) */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-4 py-3.5">
                      User Code
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Member
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Role
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Assigned Greenhouses
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Verification
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Activity
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.map((user) => {
                    const roleStyle = ROLE_BADGE_STYLES[user.role];
                    const statusBadge = STATUS_BADGE_STYLES[user.accountStatus];
                    const initials = getUserInitials(user.name);

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                          <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                            {user.userCode}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${roleStyle.avatarClass}`}
                              aria-hidden="true"
                            >
                              {initials}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {user.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {user.email}
                              </p>
                              {user.businessName || user.phone ? (
                                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                  {[user.businessName, user.phone]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleStyle.badgeClass}`}
                          >
                            {roleStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <GreenhouseTags
                            greenhouses={user.assignedGreenhouses}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                          <EmailVerifiedBadge verified={user.emailVerified} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-slate-600">
                          <p>{formatDate(user.lastLoginAt)}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Joined {formatDate(user.createdAt)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle">
                          <UserStatusActions
                            user={user}
                            currentUserId={currentUserId}
                            updatingUserId={updatingUserId}
                            onRequestStatusChange={handleRequestStatusChange}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Card View (360px+ to 1023px) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
            {filteredUsers.map((user) => {
              const roleStyle = ROLE_BADGE_STYLES[user.role];
              const statusBadge = STATUS_BADGE_STYLES[user.accountStatus];
              const initials = getUserInitials(user.name);

              return (
                <article
                  key={user.id}
                  className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                      {user.userCode}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                      <UserStatusActions
                        user={user}
                        currentUserId={currentUserId}
                        updatingUserId={updatingUserId}
                        onRequestStatusChange={handleRequestStatusChange}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-3 min-w-0">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${roleStyle.avatarClass}`}
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-slate-900">
                        {user.name}
                      </h3>
                      <p className="break-all text-xs text-slate-500">
                        {user.email}
                      </p>
                      {user.businessName || user.phone ? (
                        <p className="mt-1 break-words text-xs text-slate-400">
                          {[user.businessName, user.phone]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleStyle.badgeClass}`}
                    >
                      {roleStyle.label}
                    </span>
                    <EmailVerifiedBadge verified={user.emailVerified} />
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Assigned Greenhouses
                    </p>
                    <GreenhouseTags greenhouses={user.assignedGreenhouses} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                    <span>Last login: {formatDate(user.lastLoginAt)}</span>
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <CreateStaffModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleStaffCreated}
      />

      {pendingStatusAction ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-status-title"
          aria-describedby="confirm-status-desc"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <h3
              id="confirm-status-title"
              className="text-lg font-bold text-slate-900"
            >
              {pendingStatusAction.nextStatus === "SUSPENDED"
                ? "Suspend user account?"
                : "Deactivate user account?"}
            </h3>
            <p
              id="confirm-status-desc"
              className="mt-2 text-sm leading-relaxed text-slate-600"
            >
              You are about to set{" "}
              <span className="font-semibold text-slate-900">
                {pendingStatusAction.user.name}
              </span>{" "}
              (
              <span className="font-mono text-xs">
                {pendingStatusAction.user.userCode}
              </span>
              ) to{" "}
              <span className="font-semibold text-rose-700">
                {pendingStatusAction.nextStatus}
              </span>
              . They will immediately lose portal sign-in access until
              reactivated.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={updatingUserId === pendingStatusAction.user.id}
                onClick={() => setPendingStatusAction(null)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingUserId === pendingStatusAction.user.id}
                onClick={() =>
                  void executeStatusUpdate(
                    pendingStatusAction.user,
                    pendingStatusAction.nextStatus
                  )
                }
                className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm cursor-pointer disabled:opacity-60 ${
                  pendingStatusAction.nextStatus === "SUSPENDED"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {updatingUserId === pendingStatusAction.user.id
                  ? "Updating..."
                  : pendingStatusAction.nextStatus === "SUSPENDED"
                  ? "Confirm Suspend"
                  : "Confirm Deactivate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
