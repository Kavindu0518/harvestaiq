import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, recordAuthAuditLog } from "@/lib/audit";
import { hashToken } from "@/lib/tokens";
import { strongPasswordSchema } from "@/lib/validation";

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required."),
  password: strongPasswordSchema,
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

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Validation failed.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);
    const now = new Date();

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.expiresAt <= now) {
      if (resetToken) {
        await prisma.passwordResetToken
          .delete({ where: { id: resetToken.id } })
          .catch(() => undefined);
      }
      return NextResponse.json(
        { error: "Invalid or expired password reset token." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    const { ipAddress, userAgent } = extractRequestMeta(request);
    await recordAuthAuditLog({
      userId: user.id,
      email: user.email,
      event: AuthEventType.PASSWORD_RESET_COMPLETED,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: "Password has been reset successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Unable to reset password. Please try again later." },
      { status: 500 }
    );
  }
}
