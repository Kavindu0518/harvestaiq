import { Suspense } from "react";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard-shell";
import { requirePortalSession } from "@/lib/require-route-auth";

async function BuyerDashboardContent() {
  const user = await requirePortalSession("/buyer");

  return (
    <DashboardShell
      portalTitle="Buyer Procurement Portal"
      portalSubtitle="Browse upcoming greenhouse harvest availability, place wholesale produce orders, and track delivery batches."
      user={user}
      modules={[
        {
          title: "Harvest Availability",
          badge: "Catalog",
          description:
            "View weekly graded quantities for bell peppers, cherry tomatoes, salad cucumbers, and leafy greens.",
        },
        {
          title: "Wholesale Orders",
          badge: "Procurement",
          description:
            "Submit purchase schedules, reserve recurring lots, and review invoice summaries.",
        },
        {
          title: "Batch Traceability",
          badge: "Quality",
          description:
            "Inspect harvest dates, greenhouse origin codes, and cold-chain dispatch status.",
        },
      ]}
    />
  );
}

export default function BuyerDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <BuyerDashboardContent />
    </Suspense>
  );
}
