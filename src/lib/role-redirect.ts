import type { Role } from "@prisma/client";

const DEFAULT_DASHBOARD_BY_ROLE: Record<Role, string> = {
  OWNER_ADMIN: "/owner",
  FARM_MANAGER: "/manager",
  AGRONOMIST: "/agronomy",
  GREENHOUSE_TECH: "/operations",
  BUYER: "/buyer",
};

const ALLOWED_ROUTE_PREFIXES_BY_ROLE: Record<Role, readonly string[]> = {
  OWNER_ADMIN: ["/owner"],
  FARM_MANAGER: ["/manager", "/agronomy", "/operations"],
  AGRONOMIST: [
    "/agronomy",
    "/manager/crops",
    "/manager/inputs",
    "/manager/alerts",
  ],
  GREENHOUSE_TECH: ["/operations"],
  BUYER: ["/buyer"],
};

function normalizePathname(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/, 1)[0] ?? "/";
  const withLeadingSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Returns the default landing dashboard path for a given user role.
 */
export function getDefaultDashboard(role: Role): string {
  return DEFAULT_DASHBOARD_BY_ROLE[role] ?? "/buyer";
}

/**
 * Checks whether a user with `role` is permitted to access `pathname`.
 */
export function isRouteAllowedForRole(role: Role, pathname: string): boolean {
  const allowedPrefixes = ALLOWED_ROUTE_PREFIXES_BY_ROLE[role];
  if (!allowedPrefixes) {
    return false;
  }

  const normalized = normalizePathname(pathname);
  return allowedPrefixes.some((prefix) => matchesPrefix(normalized, prefix));
}
