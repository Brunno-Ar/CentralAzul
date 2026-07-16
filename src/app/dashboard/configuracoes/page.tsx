import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ConfiguracoesClient from "./ConfiguracoesClient";

export default async function ConfiguracoesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    hierarchyLevel?: number;
  };

  return (
    <ConfiguracoesClient
      initialUser={{
        id: user.id || "",
        name: user.name || "",
        email: user.email || "",
        image: user.image || "",
        role: user.role || "VIEWER",
        hierarchyLevel: user.hierarchyLevel || 3,
      }}
    />
  );
}
