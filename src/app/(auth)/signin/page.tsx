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
import { Activity, ShieldCheck, Sprout } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
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

const SHOWCASE_FEATURES = [
  {
    icon: Activity,
    title: "Smart Greenhouse Telemetry",
    description:
      "Real-time climate, VPD, EC/pH fertigation, and irrigation visibility across every polyhouse bay.",
  },
  {
    icon: ShieldCheck,
    title: "RBAC Governance",
    description:
      "Role-scoped workspaces for Owners, Farm Managers, Agronomists, and Greenhouse Technicians with full audit trails.",
  },
  {
    icon: Sprout,
    title: "Direct Produce Commerce",
    description:
      "Connect verified wholesale buyers with traceable, graded controlled-environment harvests.",
  },
];

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

function SignInShowcasePanel() {
  return (
    <aside
      aria-label="HarvestAIQ platform highlights"
      className="relative hidden lg:flex lg:flex-col lg:justify-between overflow-hidden bg-[#064E3B] p-10 xl:p-14 text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl"
      />

      <div className="relative z-10">
        <BrandLogo href="/" inverted />
        <div className="mt-10 max-w-lg">
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            Enterprise Agritech Platform
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white xl:text-4xl xl:leading-tight">
            Precision greenhouse intelligence from bay sensor to buyer delivery.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/85 xl:text-base">
            Unified operations, agronomy recipes, and wholesale procurement
            engineered for modern controlled-environment farms across Sri Lanka.
          </p>
        </div>
      </div>

      <div className="relative z-10 my-8 space-y-4">
        {SHOWCASE_FEATURES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-emerald-200/80">
        <span>5 Role-Secured Portals</span>
        <span>SHA-256 Token &amp; Audit Security</span>
      </div>
    </aside>
  );
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
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col justify-between px-4 py-6 sm:px-6 lg:bg-white lg:px-12 xl:px-16">
        <header className="mx-auto flex w-full max-w-md items-center justify-between lg:max-w-lg">
          <div className="lg:hidden">
            <BrandLogo />
          </div>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors lg:ml-auto"
          >
            Back to Home
          </Link>
        </header>

        <main className="mx-auto my-auto w-full max-w-md py-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:border-0 lg:p-0 lg:shadow-none">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Portal Access
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Sign in to HarvestAIQ
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter your credentials to open your assigned workspace.
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {verified ? (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                >
                  Your email has been verified and your account is now active.
                  Sign in below with your password (or use{" "}
                  <Link
                    href="/forgot-password"
                    className="font-semibold underline underline-offset-2"
                  >
                    Forgot password
                  </Link>{" "}
                  to set a new one).
                </div>
              ) : null}

              {reset ? (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                >
                  Your password has been updated. Sign in with your new
                  password.
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
          </div>

          <div className="mt-5 text-center text-sm text-slate-600">
            New commercial buyer?{" "}
            <Link
              href="/signup"
              className="inline-flex min-h-[44px] items-center font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Create a Buyer account
            </Link>
          </div>
        </main>

        <footer className="mx-auto w-full max-w-md text-center text-xs text-slate-400 lg:text-left">
          © 2026 HarvestAIQ · Controlled-Environment Agriculture
        </footer>
      </div>

      <SignInShowcasePanel />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 lg:grid lg:grid-cols-2">
          <div className="flex min-h-screen items-center justify-center p-6 lg:bg-white">
            <div className="h-80 w-full max-w-md animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <SignInShowcasePanel />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
