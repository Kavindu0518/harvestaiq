import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getDefaultDashboard,
  isRouteAllowedForRole,
} from "@/lib/role-redirect";

/**
 * Server-side portal guard verifying authentication and role-based route access.
 */
export async function requirePortalSession(pathname: string) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  const { role, defaultPath } = session.user;
  if (!role || !isRouteAllowedForRole(role, pathname)) {
    redirect(defaultPath || (role ? getDefaultDashboard(role) : "/signin"));
  }

  return session.user;
}
