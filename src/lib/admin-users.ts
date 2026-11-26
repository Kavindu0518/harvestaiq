import type { AccountStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const STAFF_ROLES: readonly Role[] = [
  "FARM_MANAGER",
  "AGRONOMIST",
  "GREENHOUSE_TECH",
];

export interface AdminDirectoryUser {
  id: string;
  userCode: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  role: Role;
  accountStatus: AccountStatus;
  isActive: boolean;
  emailVerified: boolean;
  assignedGreenhouses: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface DirectoryKpis {
  totalUsers: number;
  activeStaff: number;
  pendingOrSuspended: number;
  registeredBuyers: number;
}

/**
 * Fetches all HarvestAIQ user records for the Owner directory, ordered newest first.
 */
export async function listAllDirectoryUsers(): Promise<AdminDirectoryUser[]> {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userCode: true,
      name: true,
      email: true,
      phone: true,
      businessName: true,
      role: true,
      accountStatus: true,
      isActive: true,
      emailVerified: true,
      assignedGreenhouses: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

/**
 * Computes the 4 Owner directory KPI counts from a list of user records.
 */
export function computeUserDirectoryKpis(
  users: readonly AdminDirectoryUser[]
): DirectoryKpis {
  let activeStaff = 0;
  let pendingOrSuspended = 0;
  let registeredBuyers = 0;

  for (const user of users) {
    if (
      STAFF_ROLES.includes(user.role) &&
      user.accountStatus === "ACTIVE" &&
      user.isActive
    ) {
      activeStaff += 1;
    }

    if (
      user.accountStatus === "PENDING" ||
      user.accountStatus === "SUSPENDED"
    ) {
      pendingOrSuspended += 1;
    }

    if (user.role === "BUYER") {
      registeredBuyers += 1;
    }
  }

  return {
    totalUsers: users.length,
    activeStaff,
    pendingOrSuspended,
    registeredBuyers,
  };
}
