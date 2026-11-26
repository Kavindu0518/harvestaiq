import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AccountStatus, AuthEventType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, recordAuthAuditLog } from "@/lib/audit";
import { sendVerificationEmail } from "@/lib/mail";
import {
  generateRawToken,
  hashToken,
  normalizeSriLankanPhone,
} from "@/lib/tokens";
import { getNextBuyerCode } from "@/lib/user-code";
import { emailSchema, strongPasswordSchema } from "@/lib/validation";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters."),
  email: emailSchema,
  phone: z.string().trim().min(1, "Phone number is required."),
  businessName: z
    .string()
    .trim()
    .max(150, "Business name must be at most 150 characters.")
    .optional()
    .nullable(),
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

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Validation failed.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeSriLankanPhone(parsed.data.phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error:
            "Invalid Sri Lankan phone number. Use 07XXXXXXXX or +947XXXXXXXX.",
        },
        { status: 400 }
      );
    }

    const { name, email, businessName, password } = parsed.data;
    const { ipAddress, userAgent } = extractRequestMeta(request);

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

    const [userCode, passwordHash] = await Promise.all([
      getNextBuyerCode(),
      bcrypt.hash(password, 12),
    ]);

    const rawToken = generateRawToken();
    const verificationTokenHash = hashToken(rawToken);
    const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TTL_MS);

    const user = await prisma.user.create({
      data: {
        userCode,
        name,
        email,
        phone: normalizedPhone,
        businessName: businessName || null,
        passwordHash,
        role: Role.BUYER,
        accountStatus: AccountStatus.PENDING,
        isActive: false,
        emailVerified: false,
        assignedGreenhouses: [],
        verificationTokenHash,
        verificationTokenExpiry,
      },
      select: {
        id: true,
        userCode: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    });

    await recordAuthAuditLog({
      userId: user.id,
      email: user.email,
      event: AuthEventType.SIGNUP,
      ipAddress,
      userAgent,
      metadata: {
        userCode: user.userCode,
        role: user.role,
      },
    });

    await sendVerificationEmail(user.email, rawToken, user.name);

    return NextResponse.json(
      {
        message:
          "Registration successful. Please check your email to verify your account.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again later." },
      { status: 500 }
    );
  }
}
