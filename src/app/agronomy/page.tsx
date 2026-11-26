import { Suspense } from "react";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard-shell";
import { requirePortalSession } from "@/lib/require-route-auth";

async function AgronomyDashboardContent() {
  const user = await requirePortalSession("/agronomy");

  return (
    <DashboardShell
      portalTitle="Agronomy Intelligence Portal"
      portalSubtitle="Optimize nutrient dosing, crop health protocols, pest scouting, and yield quality across assigned greenhouses."
      user={user}
      navLinks={
        user.role === "FARM_MANAGER"
          ? [
              { href: "/manager", label: "Manager Overview" },
              { href: "/agronomy", label: "Agronomy View" },
              { href: "/operations", label: "Operations View" },
            ]
          : [{ href: "/agronomy", label: "Agronomy Overview" }]
      }
      modules={[
        {
          title: "Crop Health & Scouting",
          badge: "Agronomy",
          description:
            "Log leaf tissue diagnostics, brix readings, and disease/pest observations per greenhouse block.",
        },
        {
          title: "Fertigation & EC/pH Recipes",
          badge: "Nutrition",
          description:
            "Adjust stage-specific nutrient formulas and drainage targets for peak controlled-environment yield.",
        },
        {
          title: "Agronomic Alerts",
          badge: "Diagnostics",
          description:
            "Respond to VPD stress, root-zone anomalies, and crop stage intervention triggers.",
        },
      ]}
    />
  );
}

export default function AgronomyDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AgronomyDashboardContent />
    </Suspense>
  );
}
