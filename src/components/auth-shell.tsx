import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 flex flex-col">
      <header className="w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo />
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
            </div>

            {children}
          </div>

          {footer ? (
            <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
