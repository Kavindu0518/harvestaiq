import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { SignOutButton } from "@/components/sign-out-button";
import { OwnerShellClient, type OwnerNavKey } from "./owner-shell-client";

interface OwnerShellProps {
  activeNav: OwnerNavKey;
  user: {
    name?: string | null;
    email?: string | null;
    userCode: string;
  };
  children: ReactNode;
}

export function OwnerPageSkeleton({ showTable = false }: { showTable?: boolean }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 flex">
      <aside className="hidden lg:flex lg:w-[240px] lg:flex-col border-r border-slate-200/80 bg-white p-4">
        <BrandLogo href="/owner" />
        <div className="mt-8 space-y-2">
          <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </aside>
      <div className="flex flex-1 flex-col min-w-0">
        <header className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="h-36 animate-pulse rounded-2xl bg-emerald-900/10" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
              />
            ))}
          </div>
          {showTable ? (
            <div className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export function OwnerShell({ activeNav, user, children }: OwnerShellProps) {
  return (
    <OwnerShellClient
      activeNav={activeNav}
      user={user}
      signOutSlot={<SignOutButton />}
    >
      {children}
    </OwnerShellClient>
  );
}
