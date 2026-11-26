import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountStatus, AuthEventType, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, recordAuthAuditLog } from "@/lib/audit";
import { objectIdSchema } from "@/lib/validation";

const updateStatusSchema = z.object({
  accountStatus: z.enum([
    AccountStatus.ACTIVE,
    AccountStatus.SUSPENDED,
    AccountStatus.INACTIVE,
  ]),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== Role.OWNER_ADMIN) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    if (!objectIdSchema.safeParse(id).success) {
      return NextResponse.json(
        { error: "Invalid user identifier." },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Validation failed.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { accountStatus, isActive } = parsed.data;
    const nextIsActive =
      isActive ?? (accountStatus === AccountStatus.ACTIVE);

    if (
      id === session.user.id &&
      (accountStatus !== AccountStatus.ACTIVE || !nextIsActive)
    ) {
      return NextResponse.json(
        { error: "You cannot suspend or deactivate your own owner account." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        accountStatus: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        accountStatus,
        isActive: nextIsActive,
        ...(accountStatus === AccountStatus.ACTIVE && nextIsActive
          ? { failedLoginAttempts: 0, lockedUntil: null }
          : {}),
      },
      select: {
        id: true,
        userCode: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        isActive: true,
      },
    });

    const { ipAddress, userAgent } = extractRequestMeta(request);
    await recordAuthAuditLog({
      userId: updatedUser.id,
      email: updatedUser.email,
      event: AuthEventType.STATUS_CHANGED,
      ipAddress,
      userAgent,
      metadata: {
        previousStatus: existingUser.accountStatus,
        newStatus: updatedUser.accountStatus,
        previousIsActive: existingUser.isActive,
        newIsActive: updatedUser.isActive,
        changedByUserId: session.user.id,
        changedByEmail: session.user.email ?? null,
      },
    });

    return NextResponse.json(
      {
        message: "User account status updated.",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json(
      { error: "Unable to update user status." },
      { status: 500 }
    );
  }
}
