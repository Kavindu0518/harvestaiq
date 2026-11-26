"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";
import {
  PasswordChecklist,
  isPasswordStrong,
} from "@/components/password-checklist";
import { normalizeSriLankanPhone } from "@/lib/phone";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const normalizedPhone = useMemo(() => {
    if (!phone.trim()) return null;
    return normalizeSriLankanPhone(phone);
  }, [phone]);

  const phoneIsInvalid = phone.trim().length > 0 && !normalizedPhone;
  const passwordStrong = isPasswordStrong(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const confirmMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    if (!normalizedPhone) {
      setErrorMessage(
        "Please enter a valid Sri Lankan mobile number (07XXXXXXXX or +947XXXXXXXX)."
      );
      return;
    }

    if (!passwordStrong) {
      setErrorMessage(
        "Please choose a stronger password that meets all listed requirements."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage(
        "Please accept the Terms of Service and Privacy Policy to continue."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: normalizedPhone,
          businessName: businessName.trim() || undefined,
          password,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: { email?: string };
      };

      if (!response.ok) {
        setErrorMessage(
          data.error || "Unable to register account. Please check your inputs."
        );
        return;
      }

      setRegisteredEmail(data.user?.email || email.trim().toLowerCase());
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return (
      <AuthShell
        title="Verify your email"
        subtitle="Your Buyer account has been created."
      >
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900"
          >
            We sent a verification link to{" "}
            <span className="font-semibold break-all">{registeredEmail}</span>.
            Open the link in your inbox within 24 hours to activate your
            HarvestAIQ buyer account.
          </div>

          <Link
            href="/signin"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Go to Sign In
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Buyer Registration"
      subtitle="Create a HarvestAIQ buyer account for direct greenhouse produce procurement."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/signin"
            className="inline-flex min-h-[44px] items-center font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
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
            htmlFor="signup-name"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Full name
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kasun Perera"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-100 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="buyer@company.lk"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-100 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="signup-phone"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Sri Lankan mobile number
          </label>
          <input
            id="signup-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            disabled={loading}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0771234567 or +94771234567"
            aria-invalid={phoneIsInvalid}
            className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 sm:text-sm ${
              phoneIsInvalid
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                : normalizedPhone
                ? "border-emerald-500 focus:border-emerald-600 focus:ring-emerald-600/20"
                : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/20"
            }`}
          />
          {phoneIsInvalid ? (
            <p className="mt-1 text-xs text-rose-600">
              Enter a valid Sri Lankan mobile number (e.g. 0771234567 or
              +94771234567).
            </p>
          ) : normalizedPhone ? (
            <p className="mt-1 text-xs text-emerald-700">
              Normalized: <span className="font-mono">{normalizedPhone}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Accepted formats: 07XXXXXXXX or +947XXXXXXXX
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-business"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Business name <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="signup-business"
            name="businessName"
            type="text"
            autoComplete="organization"
            disabled={loading}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Lanka Fresh Produce (Pvt) Ltd"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-100 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <PasswordInput
            id="signup-password"
            name="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="Create a strong password"
            disabled={loading}
          />
          <PasswordChecklist password={password} />
        </div>

        <div>
          <label
            htmlFor="signup-confirm-password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Confirm password
          </label>
          <PasswordInput
            id="signup-confirm-password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            disabled={loading}
          />
          {confirmMismatch ? (
            <p className="mt-1 text-xs text-rose-600">
              Passwords do not match.
            </p>
          ) : passwordsMatch ? (
            <p className="mt-1 text-xs text-emerald-700">Passwords match.</p>
          ) : null}
        </div>

        <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 pt-1 text-sm text-slate-700 select-none">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={loading}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          <span>
            I agree to HarvestAIQ&apos;s buyer procurement terms and privacy
            guidelines.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Creating account..." : "Create Buyer Account"}
        </button>
      </form>
    </AuthShell>
  );
}
