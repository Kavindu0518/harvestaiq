import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AccountStatus, AuthEventType, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, recordAuthAuditLog } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/mail";
import {
  generateRawToken,
  hashToken,
  normalizeSriLankanPhone,
} from "@/lib/tokens";
import { getNextStaffCode } from "@/lib/user-code";
import { emailSchema } from "@/lib/validation";

const STAFF_SETUP_TTL_MS = 24 * 60 * 60 * 1000;

const createStaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters."),
  email: emailSchema,
  phone: z.string().trim().optional().nullable(),
  role: z.enum([Role.FARM_MANAGER, Role.AGRONOMIST, Role.GREENHOUSE_TECH]),
  assignedGreenhouses: z.array(z.string().trim().min(1)).default([]),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const actorRole = session.user.role;
    if (actorRole !== Role.OWNER_ADMIN && actorRole !== Role.FARM_MANAGER) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Validation failed.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, phone, role, assignedGreenhouses } = parsed.data;

    if (actorRole === Role.FARM_MANAGER && role === Role.FARM_MANAGER) {
      return NextResponse.json(
        {
          error:
            "Farm Managers can only create non-manager staff accounts.",
        },
        { status: 403 }
      );
    }

    let normalizedPhone: string | null = null;
    if (phone && phone.length > 0) {
      normalizedPhone = normalizeSriLankanPhone(phone);
      if (!normalizedPhone) {
        return NextResponse.json(
          {
            error:
              "Invalid Sri Lankan phone number. Use 07XXXXXXXX or +947XXXXXXXX.",
          },
          { status: 400 }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const uniqueGreenhouses = Array.from(new Set(assignedGreenhouses));
    const [userCode, placeholderPasswordHash] = await Promise.all([
      getNextStaffCode(),
      bcrypt.hash(generateRawToken(32), 12),
    ]);

    const now = new Date();
    const user = await prisma.user.create({
      data: {
        userCode,
        name,
        email,
        phone: normalizedPhone,
        passwordHash: placeholderPasswordHash,
        role,
        accountStatus: AccountStatus.ACTIVE,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: now,
        assignedGreenhouses: uniqueGreenhouses,
      },
      select: {
        id: true,
        userCode: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        isActive: true,
        assignedGreenhouses: true,
      },
    });

    const rawSetupToken = generateRawToken();
    const tokenHash = hashToken(rawSetupToken);
    const expiresAt = new Date(Date.now() + STAFF_SETUP_TTL_MS);

    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        tokenHash,
        expiresAt,
      },
    });

    const { ipAddress, userAgent } = extractRequestMeta(request);
    await recordAuthAuditLog({
      userId: user.id,
      email: user.email,
      event: AuthEventType.ROLE_ACCESS_UPDATED,
      ipAddress,
      userAgent,
      metadata: {
        action: "STAFF_CREATED",
        userCode: user.userCode,
        role: user.role,
        assignedGreenhouses: user.assignedGreenhouses,
        createdByUserId: session.user.id,
        createdByEmail: session.user.email ?? null,
      },
    });

    await sendPasswordResetEmail(user.email, rawSetupToken, user.name);

    return NextResponse.json(
      {
        message:
          "Staff account created and password-setup email sent.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json(
      { error: "Unable to create staff account." },
      { status: 500 }
    );
  }
}
