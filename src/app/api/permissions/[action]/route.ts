import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { action } = await params;
    const userRole = (session.user as SessionUser).role || "VIEWER";

    const allowed = await hasPermission(userRole, action);
    return NextResponse.json({ hasPermission: allowed });
  } catch (error) {
    console.error("Erro ao verificar permissao:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
