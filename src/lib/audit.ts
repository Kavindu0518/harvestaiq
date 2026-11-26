import { AuthEventType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Extracts client IP address and User-Agent from an incoming Request.
 */
export function extractRequestMeta(request?: Request): RequestMeta {
  if (!request) {
    return { ipAddress: null, userAgent: null };
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null;
  const userAgent = request.headers.get("user-agent") || null;

  return { ipAddress, userAgent };
}

/**
 * Writes an authentication/security audit record to `AuthAuditLog`.
 */
export async function recordAuthAuditLog(params: {
  userId?: string | null;
  email: string;
  event: AuthEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.authAuditLog.create({
    data: {
      userId: params.userId ?? null,
      email: params.email,
      event: params.event,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      metadata: params.metadata,
    },
  });
}
