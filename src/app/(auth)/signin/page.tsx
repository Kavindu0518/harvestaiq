"use client";

import {
  Suspense,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";

const REMEMBER_EMAIL_KEY = "harvestaiq_remembered_email";

const ERROR_MESSAGES: Record<string, { tone: "amber" | "rose"; text: string }> = {
  ACCOUNT_LOCKED: {
    tone: "rose",
    text: "Too many failed login attempts. Your account is temporarily locked for 15 minutes.",
  },
  ACCOUNT_PENDING: {
    tone: "amber",
    text: "Your account is pending email verification. Please check your inbox and verify your email first.",
  },
  ACCOUNT_SUSPENDED: {
    tone: "rose",
    text: "Your account has been suspended. Please contact an administrator for assistance.",
  },
  ACCOUNT_INACTIVE: {
    tone: "rose",
    text: "Your account is currently inactive. Please contact an administrator to reactivate access.",
  },
  InvalidVerificationToken: {
    tone: "rose",
    text: "That email verification link is invalid. Please request or check for a newer link.",
  },
  ExpiredVerificationToken: {
    tone: "amber",
    text: "Your verification link has expired. Please contact support or register again.",
  },
  VerificationFailed: {
    tone: "rose",
    text: "We could not verify your email at this time. Please try again.",
  },
};

function getSafeCallbackUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/signin")) {
    return null;
  }
  return raw;
}

function subscribeNoop() {
  return () => {};
}

function getRememberedEmailSnapshot(): string {
  try {
    return window.localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const verified = searchParams.get("verified") === "true";
  const reset = searchParams.get("reset") === "true";
  const queryError = searchParams.get("error");
  const queryCode = searchParams.get("code");
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const savedEmail = useSyncExternalStore(
    subscribeNoop,
    getRememberedEmailSnapshot,
    () => ""
  );

  const [emailOverride, setEmailOverride] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [rememberOverride, setRememberOverride] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<{
    tone: "amber" | "rose";
    text: string;
  } | null>(null);

  const email = emailOverride ?? savedEmail;
  const rememberMe = rememberOverride ?? Boolean(savedEmail);

  const queryBannerError = useMemo(() => {
    const codeOrError = queryCode || queryError;
    if (codeOrError && ERROR_MESSAGES[codeOrError]) {
      return ERROR_MESSAGES[codeOrError];
    }
    if (queryError === "CredentialsSignin") {
      return {
        tone: "rose" as const,
        text: "Invalid email or password. Please try again.",
      };
    }
    return null;
  }, [queryCode, queryError]);

  const activeError = formError ?? queryBannerError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      try {
        if (rememberMe && email.trim()) {
          window.localStorage.setItem(
            REMEMBER_EMAIL_KEY,
            email.trim().toLowerCase()
          );
        } else {
          window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // Ignore storage errors
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        const mapped = result?.code ? ERROR_MESSAGES[result.code] : undefined;
        setFormError(
          mapped ?? {
            tone: "rose",
            text: "Invalid email or password. Please check your credentials and try again.",
          }
        );
        return;
      }

      const session = await getSession();
      const target = callbackUrl || session?.user?.defaultPath || "/";
      router.push(target);
      router.refresh();
    } catch {
      setFormError({
        tone: "rose",
        text: "Unable to sign in right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to HarvestAIQ"
      subtitle="Access your greenhouse, agronomy, or buyer portal."
      footer={
        <>
          New commercial buyer?{" "}
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] items-center font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Create a Buyer account
          </Link>
        </>
      }
    >
      <div className="space-y-3 mb-5">
        {verified ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            Your email has been verified. Your account is now active — please
            sign in below.
          </div>
        ) : null}

        {reset ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            Your password has been updated. Sign in with your new password.
          </div>
        ) : null}

        {activeError ? (
          <div
            role="alert"
            className={`rounded-xl border px-4 py-3 text-sm ${
              activeError.tone === "amber"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {activeError.text}
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="signin-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmailOverride(e.target.value)}
            placeholder="you@harvestaiq.lk"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-100 sm:text-sm"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="signin-password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="inline-flex min-h-[44px] items-center px-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="signin-password"
            name="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>

        <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-slate-700 select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberOverride(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          <span>Remember my email on this device</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Sign in to HarvestAIQ"
          subtitle="Loading sign-in form..."
        >
          <div className="h-56 animate-pulse rounded-xl bg-emerald-50" />
        </AuthShell>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
