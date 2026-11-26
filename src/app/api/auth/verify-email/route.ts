import { NextRequest, NextResponse } from "next/server";
import { AccountStatus, AuthEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, recordAuthAuditLog } from "@/lib/audit";
import { hashToken } from "@/lib/tokens";

function redirectToSignIn(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/signin?${query}`, request.url));
}

export async function GET(request: NextRequest) {
  try {
    const rawToken = request.nextUrl.searchParams.get("token")?.trim();
    if (!rawToken) {
      return redirectToSignIn(request, "error=InvalidVerificationToken");
    }

    const tokenHash = hashToken(rawToken);
    const now = new Date();

    const user = await prisma.user.findFirst({
      where: { verificationTokenHash: tokenHash },
    });

    if (!user) {
      return redirectToSignIn(request, "error=InvalidVerificationToken");
    }

    if (!user.verificationTokenExpiry || user.verificationTokenExpiry <= now) {
      return redirectToSignIn(request, "error=ExpiredVerificationToken");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: now,
        accountStatus: AccountStatus.ACTIVE,
        isActive: true,
        verificationTokenHash: null,
        verificationTokenExpiry: null,
      },
    });

    const { ipAddress, userAgent } = extractRequestMeta(request);
    await recordAuthAuditLog({
      userId: user.id,
      email: user.email,
      event: AuthEventType.EMAIL_VERIFIED,
      ipAddress,
      userAgent,
    });

    return redirectToSignIn(request, "verified=true");
  } catch (error) {
    console.error("Email verification error:", error);
    return redirectToSignIn(request, "error=VerificationFailed");
  }
}
