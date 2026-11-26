import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { getDefaultDashboard, isRouteAllowedForRole } from "@/lib/role-redirect";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  if (!session?.user) {
    const signInUrl = new URL("/signin", nextUrl.origin);
    const callbackUrl = `${pathname}${nextUrl.search}`;
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signInUrl);
  }

  const { role, defaultPath } = session.user;

  if (!role || !isRouteAllowedForRole(role, pathname)) {
    const redirectPath =
      defaultPath || (role ? getDefaultDashboard(role) : "/signin");
    return NextResponse.redirect(new URL(redirectPath, nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/owner/:path*",
    "/manager/:path*",
    "/agronomy/:path*",
    "/operations/:path*",
    "/buyer/:path*",
  ],
};
