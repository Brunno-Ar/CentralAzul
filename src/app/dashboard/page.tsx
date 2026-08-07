import { auth } from "@/auth";
import DashboardHomeClient from "./DashboardHomeClient";
import { getDashboardData } from "@/lib/services/dashboard-service";

export default async function DashboardHome() {
  const session = await auth();
  const user = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
        hierarchyLevel?: number;
        company?: string;
        status?: string;
      }
    | undefined;

  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;
  const userCompany = user?.company;

  const dashboardData = await getDashboardData({ userLevel, userCompany });

  return (
    <DashboardHomeClient
      userName={user?.name}
      userRole={userRole}
      userLevel={userLevel}
      stats={dashboardData.stats}
      recentLogs={dashboardData.recentLogs}
      companies={dashboardData.companies}
    />
  );
}
