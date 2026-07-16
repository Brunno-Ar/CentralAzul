import { auth } from "@/auth";
import { DEFAULT_FILTERS } from "@/lib/mock/dashboard-metrics";
import { computeMetrics } from "@/lib/services/metrics-service";
import { db } from "@/lib/db";
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

  // Agrega dados dinamicos reais do banco de dados (revenueData,
  // socialLinks, analytics) em vez de mock estatico.
  const data = await computeMetrics(DEFAULT_FILTERS).catch(() => null);

  // Substitui o array estatico UNIT_OPTIONS por unidades de negocio dinamicas do banco.
  const businessUnitsData = await db.getBusinessUnits().catch(() => []);
  const unitOptions = [
    { value: "all", label: "Todas as Unidades" },
    ...businessUnitsData.map((bu) => ({ value: bu.slug, label: bu.name })),
  ];

  // Fallback para generateDashboardMockData quando computeMetrics falha
  if (!data) {
    const { generateDashboardMockData } = await import("@/lib/mock/dashboard-metrics");
    const mockData = generateDashboardMockData(DEFAULT_FILTERS);
    return (
      <MetricasClient
        userRole={userRole}
        userLevel={userLevel}
        data={mockData}
        unitOptions={unitOptions}
      />
    );
  }

  return (
    <MetricasClient
      userRole={userRole}
      userLevel={userLevel}
      data={data}
      unitOptions={unitOptions}
    />
  );
}
