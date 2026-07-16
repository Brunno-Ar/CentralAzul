import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EmpresasClient from "./EmpresasClient";

export default async function EmpresasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userLevel = (session.user as { hierarchyLevel?: number }).hierarchyLevel || 3;

  if (userLevel !== 1) {
    redirect("/dashboard/configuracoes");
  }

  const companies = await db.getCompanies();

  return (
    <EmpresasClient
      initialCompanies={companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        color: c.color,
        holding: (c as { holding?: string | null }).holding ?? null,
        isActive: c.isActive,
        showOnHome: c.showOnHome,
        order: c.order,
      }))}
      userLevel={userLevel}
    />
  );
}
