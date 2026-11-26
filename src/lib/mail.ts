import nodemailer from "nodemailer";

interface EmailLayoutOptions {
  preheader: string;
  heading: string;
  greeting: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}

interface DeliverEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  fallbackLabel: string;
  actionUrl: string;
}

function getAppUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

function getSmtpConfig() {
  const email =
    process.env.SMTP_EMAIL?.trim() || process.env.SMTP_USER?.trim() || "";
  const rawPassword =
    process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "";
  const password = rawPassword.replace(/\s+/g, "");
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const parsedPort = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const port = Number.isNaN(parsedPort) ? 587 : parsedPort;
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_EMAIL?.trim() ||
    email;

  return { email, password, host, port, from };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildActionUrl(path: string, tokenOrUrl: string): string {
  if (/^https?:\/\//i.test(tokenOrUrl)) {
    return tokenOrUrl;
  }
  return `${getAppUrl()}${path}?token=${encodeURIComponent(tokenOrUrl)}`;
}

function renderEmailLayout({
  preheader,
  heading,
  greeting,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
}: EmailLayoutOptions): string {
  const safeUrl = escapeHtml(ctaUrl);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #d1fae5; overflow: hidden;">
            <tr>
              <td style="background-color: #064e3b; padding: 22px 24px; text-align: left;">
                <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">Harvest<span style="color: #6ee7b7;">AIQ</span></span>
                <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0; letter-spacing: 0.04em; text-transform: uppercase;">Smart Greenhouse Platform</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 24px;">
                <h1 style="margin: 0 0 14px; font-size: 22px; line-height: 1.3; font-weight: 700; color: #0f172a;">${escapeHtml(heading)}</h1>
                <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #334155;">${escapeHtml(greeting)}</p>
                <div style="font-size: 15px; line-height: 1.6; color: #334155;">${bodyHtml}</div>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                  <tr>
                    <td style="border-radius: 10px; background-color: #059669;">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 13px 22px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">
                        ${escapeHtml(ctaLabel)}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: #475569;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin: 0 0 20px; font-size: 12px; line-height: 1.5; color: #047857; word-break: break-all;">
                  <a href="${safeUrl}" style="color: #047857; text-decoration: underline;">${safeUrl}</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">${escapeHtml(footerNote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function deliverEmail({
  to,
  subject,
  text,
  html,
  fallbackLabel,
  actionUrl,
}: DeliverEmailOptions): Promise<void> {
  const smtp = getSmtpConfig();

  if (!smtp.email || !smtp.password || !smtp.from) {
    console.info(
      `[HarvestAIQ Mail] SMTP credentials are not configured. ${fallbackLabel} URL for ${to}: ${actionUrl}`
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.email,
      pass: smtp.password,
    },
  });

  try {
    await transporter.sendMail({
      from: smtp.from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    const err = error as {
      message?: string;
      code?: string;
      responseCode?: number;
      command?: string;
    };
    console.error("[HarvestAIQ Mail] SMTP delivery failed", {
      to,
      subject,
      host: smtp.host,
      port: smtp.port,
      code: err?.code,
      responseCode: err?.responseCode,
      command: err?.command,
      message: err?.message ?? "Unknown SMTP error",
    });
    throw error;
  }
}

/**
 * Sends an email verification link to a newly registered buyer.
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  name?: string
): Promise<void> {
  const verificationUrl = buildActionUrl("/api/auth/verify-email", token);
  const greeting = name ? `Hello ${name},` : "Hello,";

  await deliverEmail({
    to,
    subject: "Verify your HarvestAIQ account",
    fallbackLabel: "Verification",
    actionUrl: verificationUrl,
    text: `${greeting}\n\nPlease verify your HarvestAIQ email address by opening the link below:\n${verificationUrl}\n\nThis link will expire in 24 hours. If you did not create an account, you can safely ignore this email.`,
    html: renderEmailLayout({
      preheader: "Verify your email address to activate your HarvestAIQ account.",
      heading: "Welcome to HarvestAIQ",
      greeting,
      bodyHtml:
        '<p style="margin: 0 0 12px;">Thank you for registering on HarvestAIQ. Verify your email address within <strong>24 hours</strong> to activate your account and access the buyer portal.</p>',
      ctaLabel: "Verify Email Address",
      ctaUrl: verificationUrl,
      footerNote:
        "If you did not create a HarvestAIQ account, you can safely ignore this email.",
    }),
  });
}

/**
 * Sends a password reset link to an existing user.
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name?: string
): Promise<void> {
  const resetUrl = buildActionUrl("/reset-password", token);
  const greeting = name ? `Hello ${name},` : "Hello,";

  await deliverEmail({
    to,
    subject: "Reset your HarvestAIQ password",
    fallbackLabel: "Password reset",
    actionUrl: resetUrl,
    text: `${greeting}\n\nWe received a request to reset your HarvestAIQ password. Open the link below to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.`,
    html: renderEmailLayout({
      preheader: "Use this link to reset your HarvestAIQ account password.",
      heading: "Reset your password",
      greeting,
      bodyHtml:
        '<p style="margin: 0 0 12px;">We received a request to reset your HarvestAIQ account password. Click the button below to choose a new password.</p><p style="margin: 0;">This link will expire in <strong>1 hour</strong>.</p>',
      ctaLabel: "Reset Password",
      ctaUrl: resetUrl,
      footerNote:
        "If you did not request a password reset, you can safely ignore this email.",
    }),
  });
}

/**
 * Sends a verification email with a 24-hour verification link to a newly created staff member.
 */
export async function sendStaffWelcomeEmail(
  to: string,
  token: string,
  details: {
    name?: string;
    userCode: string;
    role: string;
    assignedGreenhouses: string[];
  }
): Promise<void> {
  const verificationUrl = buildActionUrl("/api/auth/verify-email", token);
  const greeting = details.name ? `Hello ${details.name},` : "Hello,";
  const greenhousesText =
    details.assignedGreenhouses.length > 0
      ? details.assignedGreenhouses.join(", ")
      : "None assigned";

  await deliverEmail({
    to,
    subject: "Verify Your HarvestAIQ Staff Account",
    fallbackLabel: "Staff email verification",
    actionUrl: verificationUrl,
    text: `${greeting}\n\nAn administrator has created your HarvestAIQ staff account.\n\nUser Code: ${details.userCode}\nRole: ${details.role}\nAssigned Greenhouses: ${greenhousesText}\n\nPlease verify your email address within 24 hours to activate your account:\n${verificationUrl}\n\nOnce verified, sign in using your temporary password (or use Forgot Password to choose a new one).`,
    html: renderEmailLayout({
      preheader: `Verify your email to activate your HarvestAIQ staff account (${details.userCode}).`,
      heading: "Verify Your HarvestAIQ Staff Account",
      greeting,
      bodyHtml: `
        <p style="margin: 0 0 14px;">An administrator has created your HarvestAIQ staff account. Please verify your email address within <strong>24 hours</strong> to activate your account.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
          <tr>
            <td style="font-size: 13px; line-height: 1.7; color: #334155;">
              <div><strong>User Code:</strong> <span style="font-family: monospace; color: #047857;">${escapeHtml(details.userCode)}</span></div>
              <div><strong>Role:</strong> ${escapeHtml(details.role)}</div>
              <div><strong>Assigned Greenhouses:</strong> ${escapeHtml(greenhousesText)}</div>
            </td>
          </tr>
        </table>
        <p style="margin: 0;">After verifying, sign in on HarvestAIQ with the temporary password provided by your administrator (or use <strong>Forgot password</strong> to set your own).</p>
      `,
      ctaLabel: "Verify Email Address",
      ctaUrl: verificationUrl,
      footerNote:
        "Your account status will remain PENDING until your email address is verified. If you were not expecting this account, please contact your HarvestAIQ administrator.",
    }),
  });
}
