import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AccountStatus, AuthEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, recordAuthAuditLog } from "@/lib/audit";
import { getDefaultDashboard } from "@/lib/role-redirect";
import { authConfig } from "./auth.config";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export class LockedAccountError extends CredentialsSignin {
  code = "ACCOUNT_LOCKED";
}

export class PendingAccountError extends CredentialsSignin {
  code = "ACCOUNT_PENDING";
}

export class SuspendedAccountError extends CredentialsSignin {
  code = "ACCOUNT_SUSPENDED";
}

export class InactiveAccountError extends CredentialsSignin {
  code = "ACCOUNT_INACTIVE";
}

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const { ipAddress, userAgent } = extractRequestMeta(request);
        const now = new Date();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          await recordAuthAuditLog({
            email,
            event: AuthEventType.LOGIN_FAILED,
            ipAddress,
            userAgent,
            metadata: { reason: "USER_NOT_FOUND" },
          });
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > now) {
          await recordAuthAuditLog({
            userId: user.id,
            email: user.email,
            event: AuthEventType.LOGIN_FAILED,
            ipAddress,
            userAgent,
            metadata: {
              reason: "ACCOUNT_LOCKED",
              lockedUntil: user.lockedUntil.toISOString(),
            },
          });
          throw new LockedAccountError();
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);

        if (!passwordValid) {
          const lockExpired = Boolean(user.lockedUntil && user.lockedUntil <= now);
          const baseAttempts = lockExpired ? 0 : user.failedLoginAttempts;
          const nextAttempts = baseAttempts + 1;
          const shouldLock = nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
          const lockedUntil = shouldLock
            ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
            : null;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: nextAttempts,
              lockedUntil,
            },
          });

          await recordAuthAuditLog({
            userId: user.id,
            email: user.email,
            event: AuthEventType.LOGIN_FAILED,
            ipAddress,
            userAgent,
            metadata: {
              reason: shouldLock ? "LOCKED_AFTER_MAX_ATTEMPTS" : "INVALID_PASSWORD",
              failedLoginAttempts: nextAttempts,
              ...(lockedUntil ? { lockedUntil: lockedUntil.toISOString() } : {}),
            },
          });

          if (shouldLock) {
            throw new LockedAccountError();
          }

          return null;
        }

        if (user.accountStatus === AccountStatus.PENDING || !user.emailVerified) {
          await recordAuthAuditLog({
            userId: user.id,
            email: user.email,
            event: AuthEventType.LOGIN_FAILED,
            ipAddress,
            userAgent,
            metadata: { reason: "ACCOUNT_PENDING" },
          });
          throw new PendingAccountError();
        }

        if (user.accountStatus === AccountStatus.SUSPENDED) {
          await recordAuthAuditLog({
            userId: user.id,
            email: user.email,
            event: AuthEventType.LOGIN_FAILED,
            ipAddress,
            userAgent,
            metadata: { reason: "ACCOUNT_SUSPENDED" },
          });
          throw new SuspendedAccountError();
        }

        if (user.accountStatus === AccountStatus.INACTIVE || !user.isActive) {
          await recordAuthAuditLog({
            userId: user.id,
            email: user.email,
            event: AuthEventType.LOGIN_FAILED,
            ipAddress,
            userAgent,
            metadata: { reason: "ACCOUNT_INACTIVE" },
          });
          throw new InactiveAccountError();
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: now,
          },
        });

        await recordAuthAuditLog({
          userId: user.id,
          email: user.email,
          event: AuthEventType.LOGIN_SUCCESS,
          ipAddress,
          userAgent,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          userCode: user.userCode,
          role: user.role,
          assignedGreenhouses: user.assignedGreenhouses,
          defaultPath: getDefaultDashboard(user.role),
        };
      },
    }),
  ],
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.email) {
        await prisma.authAuditLog.create({
          data: {
            userId:
              typeof message.token.id === "string" ? message.token.id : null,
            email: message.token.email,
            event: AuthEventType.LOGOUT,
          },
        });
      }
    },
  },
});
