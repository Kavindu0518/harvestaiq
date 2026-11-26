import { ShieldAlert, ShoppingBag, UserCheck, Users } from "lucide-react";
import type { DirectoryKpis } from "@/lib/admin-users";

interface UserKpiCardsProps {
  kpis: DirectoryKpis;
}

export function UserKpiCards({ kpis }: UserKpiCardsProps) {
  const cards = [
    {
      label: "Total Users",
      value: kpis.totalUsers,
      hint: "All staff, owner & buyer accounts",
      valueClass: "text-slate-900",
      iconWrapClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
      icon: Users,
    },
    {
      label: "Active Staff",
      value: kpis.activeStaff,
      hint: "Active managers, agronomists & techs",
      valueClass: "text-emerald-700",
      iconWrapClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
      icon: UserCheck,
    },
    {
      label: "Pending / Suspended",
      value: kpis.pendingOrSuspended,
      hint: "Awaiting verification or suspended",
      valueClass: "text-amber-700",
      iconWrapClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
      icon: ShieldAlert,
    },
    {
      label: "Registered Buyers",
      value: kpis.registeredBuyers,
      hint: "Commercial wholesale accounts",
      valueClass: "text-purple-700",
      iconWrapClass: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/70",
      icon: ShoppingBag,
    },
  ];

  return (
    <section
      aria-label="User directory metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-bold tracking-tight ${card.valueClass}`}
                >
                  {card.value}
                </p>
              </div>
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconWrapClass}`}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{card.hint}</p>
          </article>
        );
      })}
    </section>
  );
}
