import nodemailer from "nodemailer";

function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || '"HarvestAIQ" <no-reply@harvestaiq.lk>';
}

function createTransporter() {
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.isNaN(port) ? 587 : port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || "",
    },
  });
}

function buildActionUrl(path: string, tokenOrUrl: string): string {
  if (/^https?:\/\//i.test(tokenOrUrl)) {
    return tokenOrUrl;
  }
  return `${getAppUrl()}${path}?token=${encodeURIComponent(tokenOrUrl)}`;
}

/**
 * Sends an email verification link to a newly registered user.
 * Logs the URL to the console when `SMTP_USER` is not configured.
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  name?: string
): Promise<void> {
  const verificationUrl = buildActionUrl("/api/auth/verify-email", token);
  const smtpUser = process.env.SMTP_USER?.trim();

  if (!smtpUser) {
    console.info(
      `[HarvestAIQ Mail] SMTP_USER is not configured. Verification URL for ${to}: ${verificationUrl}`
    );
    return;
  }

  const greeting = name ? `Hello ${name},` : "Hello,";
  const transporter = createTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Verify your HarvestAIQ account",
    text: `${greeting}\n\nPlease verify your HarvestAIQ email address by opening the link below:\n${verificationUrl}\n\nThis link will expire in 24 hours. If you did not create an account, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="color: #15803d;">Welcome to HarvestAIQ</h2>
        <p>${greeting}</p>
        <p>Please verify your email address to activate your HarvestAIQ account:</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 18px; background-color: #15803d; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Verify Email Address
          </a>
        </p>
        <p style="font-size: 13px; color: #4b5563;">Or copy and paste this link into your browser:<br />${verificationUrl}</p>
        <p style="font-size: 12px; color: #6b7280;">If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Sends a password reset link to a user.
 * Logs the URL to the console when `SMTP_USER` is not configured.
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name?: string
): Promise<void> {
  const resetUrl = buildActionUrl("/reset-password", token);
  const smtpUser = process.env.SMTP_USER?.trim();

  if (!smtpUser) {
    console.info(
      `[HarvestAIQ Mail] SMTP_USER is not configured. Password reset URL for ${to}: ${resetUrl}`
    );
    return;
  }

  const greeting = name ? `Hello ${name},` : "Hello,";
  const transporter = createTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Reset your HarvestAIQ password",
    text: `${greeting}\n\nWe received a request to reset your HarvestAIQ password. Open the link below to set a new password:\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="color: #15803d;">HarvestAIQ Password Reset</h2>
        <p>${greeting}</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 18px; background-color: #15803d; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 13px; color: #4b5563;">Or copy and paste this link into your browser:<br />${resetUrl}</p>
        <p style="font-size: 12px; color: #6b7280;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}
