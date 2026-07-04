import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateParams, markReadParamsSchema } from "@/lib/validation";
import { validateCsrf } from "@/lib/csrf";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "CSRF token invalido" }, { status: 403 });
  }

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userId = user.id;

    const paramsValidation = validateParams(await params, markReadParamsSchema);
    if (!paramsValidation.success) {
      return paramsValidation.error;
    }

    await db.markAnnouncementAsRead(paramsValidation.data.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar anúncio como lido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
