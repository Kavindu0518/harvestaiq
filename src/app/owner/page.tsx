import { Suspense } from "react";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard-shell";
import { requirePortalSession } from "@/lib/require-route-auth";

async function OwnerDashboardContent() {
  const user = await requirePortalSession("/owner");

  return (
    <DashboardShell
      portalTitle="Owner & Governance Console"
      portalSubtitle="Oversee greenhouse portfolio performance, staff provisioning, account lifecycle controls, and platform security audit logs."
      user={user}
      modules={[
        {
          title: "Staff & Access Governance",
          badge: "Administration",
          description:
            "Provision Farm Managers, Agronomists, and Greenhouse Technicians with greenhouse-scoped access.",
        },
        {
          title: "Account Status Controls",
          badge: "Security",
          description:
            "Activate, suspend, or deactivate accounts while tracking every status transition in AuthAuditLog.",
        },
        {
          title: "Portfolio Yield & Financials",
          badge: "Executive",
          description:
            "Monitor estate-wide harvest volume, buyer fulfillment velocity, and greenhouse unit economics.",
        },
      ]}
    />
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <OwnerDashboardContent />
    </Suspense>
  );
}
