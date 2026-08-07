import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validateSearchParams, paginationSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { SessionUser } from "@/types/auth";

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Validate pagination
    const paginationValidation = validateSearchParams(
      request.nextUrl.searchParams,
      paginationSchema
    );
    if (!paginationValidation.success) {
      return paginationValidation.error;
    }

    const user = session.user as SessionUser;
    const docs = await db.getDocuments(user.hierarchyLevel, user.company);

    const filteredDocs = user.hierarchyLevel === 1
      ? docs
      : docs.filter(doc =>
          doc.minHierarchyLevel >= user.hierarchyLevel &&
          (doc.category === user.company || doc.category === "CENTRAL")
        );

    return NextResponse.json(filteredDocs);
  } catch (error) {
    console.error("Erro ao listar documentos:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
