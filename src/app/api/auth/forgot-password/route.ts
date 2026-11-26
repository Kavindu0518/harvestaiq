import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountStatus, AuthEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, recordAuthAuditLog } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { emailSchema } from "@/lib/validation";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const GENERIC_SUCCESS_MESSAGE =
  "If an account with that email exists, a password reset link has been sent.";

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email address." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const { ipAddress, userAgent } = extractRequestMeta(request);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
      },
    });

    if (
      user &&
      user.accountStatus !== AccountStatus.SUSPENDED &&
      user.accountStatus !== AccountStatus.INACTIVE
    ) {
      const rawToken = generateRawToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await prisma.passwordResetToken.create({
        data: {
          email: user.email,
          tokenHash,
          expiresAt,
        },
      });

      await recordAuthAuditLog({
        userId: user.id,
        email: user.email,
        event: AuthEventType.PASSWORD_RESET_REQUESTED,
        ipAddress,
        userAgent,
      });

      await sendPasswordResetEmail(user.email, rawToken, user.name);
    }

    return NextResponse.json(
      { message: GENERIC_SUCCESS_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
