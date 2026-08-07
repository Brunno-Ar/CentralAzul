import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AtividadesClient from "./AtividadesClient";

export default async function AtividadesPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user as {
    id: string;
    name: string | null;
    role: string;
    hierarchyLevel: number;
    company?: string;
  };

  return (
    <AtividadesClient
      userId={user.id}
      userLevel={user.hierarchyLevel}
      userCompany={user.company}
    />
  );
}
