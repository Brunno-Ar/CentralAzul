import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AnalyticsSettingsClient from "./AnalyticsSettingsClient";

export default async function AnalyticsSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id?: string;
    role?: string;
    hierarchyLevel?: number;
  };

  if (user.hierarchyLevel !== 1) {
    redirect("/dashboard/configuracoes");
  }

  return <AnalyticsSettingsClient />;
}
