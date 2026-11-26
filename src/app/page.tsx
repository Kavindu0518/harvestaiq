import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { BrandLogo } from "@/components/brand-logo";

const HIGHLIGHTS = [
  {
    title: "Climate & Telemetry Control",
    description:
      "Monitor greenhouse temperature, humidity, VPD, and irrigation schedules across every polyhouse bay in real time.",
    tag: "Operations",
  },
  {
    title: "Precision Agronomy Insights",
    description:
      "Track crop health, EC/pH fertigation recipes, pest alerts, and yield forecasts backed by agronomic field logs.",
    tag: "Agronomy",
  },
  {
    title: "Direct Wholesale Procurement",
    description:
      "Verified Sri Lankan buyers connect directly with controlled-environment harvests for traceable, graded supply.",
    tag: "Marketplace",
  },
];

const ROLE_CARDS = [
  { role: "Owner Admin", scope: "Governance, staff provisioning & audit oversight" },
  { role: "Farm Manager", scope: "Cross-greenhouse scheduling, inputs & alerts" },
  { role: "Agronomist", scope: "Crop cycles, nutrient dosing & plant health" },
  { role: "Greenhouse Tech", scope: "Daily bay telemetry & climate execution" },
  { role: "Buyer", scope: "Verified wholesale orders & harvest schedules" },
];

function GuestNavLinks() {
  return (
    <>
      <Link
        href="/signin"
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        Sign In
      </Link>
      <Link
        href="/signup"
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        Buyer Sign Up
      </Link>
    </>
  );
}

async function HeaderAuthNav() {
  const session = await auth();

  if (session?.user) {
    return (
      <Link
        href={session.user.defaultPath || "/signin"}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        Open Dashboard
      </Link>
    );
  }

  return <GuestNavLinks />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50/50 flex flex-col">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo />

          <nav
            aria-label="Primary navigation"
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <Suspense fallback={<GuestNavLinks />}>
              <HeaderAuthNav />
            </Suspense>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/70 px-3.5 py-1 text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                Sri Lanka Controlled-Environment Agriculture
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.1]">
                Intelligent Greenhouse Operations &amp;{" "}
                <span className="text-emerald-600">Traceable Harvests</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                HarvestAIQ unifies farm managers, agronomists, greenhouse
                technicians, and commercial buyers on a single role-secured
                platform built for modern protected agriculture.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/signin"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:w-auto"
                >
                  Sign In to Portal
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-emerald-300 bg-white px-6 py-3 text-base font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:w-auto"
                >
                  Register as a Buyer
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white shadow-xl sm:p-7">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Role-Based Access
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold">
                      5 Dedicated Portals
                    </h2>
                  </div>
                  <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-xs text-emerald-200">
                    RBAC
                  </span>
                </div>

                <ul className="mt-4 space-y-3">
                  {ROLE_CARDS.map((item) => (
                    <li
                      key={item.role}
                      className="flex flex-col rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <span className="text-sm font-semibold text-emerald-200">
                        {item.role}
                      </span>
                      <span className="text-xs text-emerald-50/85 sm:text-right">
                        {item.scope}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-emerald-100 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Built from Seed to Supply
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Every greenhouse cycle and commercial order stays synchronized
                with verified identities and full audit visibility.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/35 p-6"
                >
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {item.tag}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-emerald-100 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p>© 2026 HarvestAIQ. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="inline-flex min-h-[44px] items-center px-2 font-medium text-emerald-700 hover:underline"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-[44px] items-center px-2 font-medium text-emerald-700 hover:underline"
            >
              Buyer Registration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
