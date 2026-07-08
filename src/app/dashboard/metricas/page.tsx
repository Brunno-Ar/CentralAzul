import { auth } from "@/auth";
import { generateDashboardMockData, DEFAULT_FILTERS } from "@/lib/mock/dashboard-metrics";
import MetricasClient from "./metricas-client";

export default async function MetricasPage() {
  const session = await auth();
  const user = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
        hierarchyLevel?: number;
      }
    | undefined;

  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;

  // Gerar dados mock deterministicos para o dashboard.
  // Quando houver dados reais de analytics sincronizados (via provider),
  // estes podem ser substituidos em blocos futuros.
  const mockData = generateDashboardMockData(DEFAULT_FILTERS);

  return (
    <MetricasClient
      userRole={userRole}
      userLevel={userLevel}
      data={mockData}
    />
  );
}
