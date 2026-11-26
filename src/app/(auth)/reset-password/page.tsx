"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";
import {
  PasswordChecklist,
  isPasswordStrong,
} from "@/components/password-checklist";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordStrong = isPasswordStrong(password);
  const confirmMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage(
        "Password reset token is missing. Please request a new reset link."
      );
      return;
    }

    if (!passwordStrong) {
      setErrorMessage(
        "Please choose a stronger password that satisfies all requirements."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          data.error || "Invalid or expired reset token. Please request a new one."
        );
        return;
      }

      router.push("/signin?reset=true");
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password to secure your HarvestAIQ account."
      footer={
        <Link
          href="/signin"
          className="inline-flex min-h-[44px] items-center font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          Back to Sign In
        </Link>
      }
    >
      {!token ? (
        <div className="space-y-4">
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          >
            Missing password reset token. Please request a fresh password reset
            link.
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Request New Reset Link
          </Link>
        </div>
      ) : (
        <>
          {errorMessage ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              {errorMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="reset-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <PasswordInput
                id="reset-password"
                name="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Enter new password"
                disabled={loading}
              />
              <PasswordChecklist password={password} />
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <PasswordInput
                id="reset-confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                disabled={loading}
              />
              {confirmMismatch ? (
                <p className="mt-1 text-xs text-rose-600">
                  Passwords do not match.
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Updating password..." : "Reset Password"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Set a new password"
          subtitle="Loading reset form..."
        >
          <div className="h-56 animate-pulse rounded-xl bg-emerald-50" />
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
