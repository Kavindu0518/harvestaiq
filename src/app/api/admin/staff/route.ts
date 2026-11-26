import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AccountStatus, AuthEventType, Role } from "@prisma/client";
import { auth } from "@/auth";
import { listAllDirectoryUsers } from "@/lib/admin-users";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, recordAuthAuditLog } from "@/lib/audit";
import { sendStaffWelcomeEmail } from "@/lib/mail";
import {
  generateRawToken,
  hashToken,
  normalizeSriLankanPhone,
} from "@/lib/tokens";
import { getNextStaffCode } from "@/lib/user-code";
import { emailSchema, strongPasswordSchema } from "@/lib/validation";

const STAFF_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const createStaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters."),
  email: emailSchema,
  phone: z.string().trim().optional().nullable(),
  role: z.enum([Role.FARM_MANAGER, Role.AGRONOMIST, Role.GREENHOUSE_TECH]),
  password: strongPasswordSchema.optional(),
  assignedGreenhouses: z.array(z.string().trim().min(1)).default([]),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== Role.OWNER_ADMIN) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const users = await listAllDirectoryUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    unstable_rethrow(error);
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Unable to load user directory." },
      { status: 500 }
    );
  }
}

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

    const { name, email, phone, role, password, assignedGreenhouses } =
      parsed.data;

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
    const rawInitialPassword = password ?? generateRawToken(32);
    const [userCode, passwordHash] = await Promise.all([
      getNextStaffCode(),
      bcrypt.hash(rawInitialPassword, 12),
    ]);

    const rawVerificationToken = generateRawToken();
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationTokenExpiry = new Date(
      Date.now() + STAFF_VERIFICATION_TTL_MS
    );

    const user = await prisma.user.create({
      data: {
        userCode,
        name,
        email,
        phone: normalizedPhone,
        passwordHash,
        role,
        accountStatus: AccountStatus.PENDING,
        isActive: false,
        emailVerified: false,
        emailVerifiedAt: null,
        assignedGreenhouses: uniqueGreenhouses,
        verificationTokenHash,
        verificationTokenExpiry,
      },
      select: {
        id: true,
        userCode: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        role: true,
        accountStatus: true,
        isActive: true,
        emailVerified: true,
        assignedGreenhouses: true,
        lastLoginAt: true,
        createdAt: true,
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

    await sendStaffWelcomeEmail(user.email, rawVerificationToken, {
      name: user.name,
      userCode: user.userCode,
      role: user.role,
      assignedGreenhouses: user.assignedGreenhouses,
    });

    return NextResponse.json(
      {
        message: "Staff account created and verification email sent.",
        user: {
          ...user,
          lastLoginAt: user.lastLoginAt
            ? user.lastLoginAt.toISOString()
            : null,
          createdAt: user.createdAt.toISOString(),
        },
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
