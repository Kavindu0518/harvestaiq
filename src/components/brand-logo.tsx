import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  inverted?: boolean;
}

export function BrandLogo({ href = "/", inverted = false }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${
          inverted
            ? "bg-white/15 text-emerald-200 ring-1 ring-white/25"
            : "bg-emerald-600 text-white"
        }`}
        aria-hidden="true"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={`text-lg font-bold tracking-tight ${
            inverted ? "text-white" : "text-slate-900"
          }`}
        >
          Harvest<span className={inverted ? "text-emerald-300" : "text-emerald-600"}>AIQ</span>
        </span>
        <span
          className={`text-[11px] font-medium tracking-wide uppercase ${
            inverted ? "text-emerald-200/80" : "text-slate-500"
          }`}
        >
          Smart Greenhouse Platform
        </span>
      </span>
    </Link>
  );
}
