import { Suspense } from "react";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard-shell";
import { requirePortalSession } from "@/lib/require-route-auth";

async function ManagerDashboardContent() {
  const user = await requirePortalSession("/manager");

  return (
    <DashboardShell
      portalTitle="Farm Management Portal"
      portalSubtitle="Coordinate crop cycles, agricultural inputs, greenhouse alerts, and operational teams across your assigned bays."
      user={user}
      navLinks={[
        { href: "/manager", label: "Manager Overview" },
        { href: "/agronomy", label: "Agronomy View" },
        { href: "/operations", label: "Operations View" },
      ]}
      modules={[
        {
          title: "Crop Cycle Scheduling",
          badge: "Planning",
          description:
            "Track transplanting, pruning, pollination, and expected harvest windows across greenhouse bays.",
        },
        {
          title: "Inputs & Inventory",
          badge: "Resources",
          description:
            "Manage fertilizers, substrates, biological controls, and stock thresholds across sites.",
        },
        {
          title: "Farm Alert Dispatch",
          badge: "Monitoring",
          description:
            "Review climate, irrigation, and crop-health escalations and assign technicians rapidly.",
        },
      ]}
    />
  );
}

export default function ManagerDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ManagerDashboardContent />
    </Suspense>
  );
}
