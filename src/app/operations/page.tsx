import { Suspense } from "react";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard-shell";
import { requirePortalSession } from "@/lib/require-route-auth";

async function OperationsDashboardContent() {
  const user = await requirePortalSession("/operations");

  return (
    <DashboardShell
      portalTitle="Greenhouse Operations Portal"
      portalSubtitle="Execute daily irrigation, ventilation, climate checks, and maintenance tasks in your assigned greenhouses."
      user={user}
      navLinks={
        user.role === "FARM_MANAGER"
          ? [
              { href: "/manager", label: "Manager Overview" },
              { href: "/agronomy", label: "Agronomy View" },
              { href: "/operations", label: "Operations View" },
            ]
          : [{ href: "/operations", label: "Operations Overview" }]
      }
      modules={[
        {
          title: "Live Bay Telemetry",
          badge: "Climate",
          description:
            "Check ambient temperature, relative humidity, PAR light levels, and shade-net status.",
        },
        {
          title: "Irrigation & Dosing Tasks",
          badge: "Execution",
          description:
            "Verify drip cycles, EC/pH inline sensor readings, and fertigation tank levels.",
        },
        {
          title: "Preventive Maintenance",
          badge: "Facility",
          description:
            "Complete fan, pad-cooling, fogger, and polyhouse structural inspection checklists.",
        },
      ]}
    />
  );
}

export default function OperationsDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <OperationsDashboardContent />
    </Suspense>
  );
}
