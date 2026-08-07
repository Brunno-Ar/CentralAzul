import { NextRequest, NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { syncBusinessUnit, syncAllBusinessUnits } from "@/lib/analytics/sync";
import type { ProviderId } from "@/lib/analytics/types";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const user = session.user as { hierarchyLevel?: number };
  if (user.hierarchyLevel !== 1) {
    return NextResponse.json(
      { error: "Apenas usuarios de Nivel 1 podem sincronizar" },
      { status: 403 },
    );
  }

  let body: {
    businessUnitId?: string;
    all?: boolean;
    providerId?: ProviderId;
  } = {};

  try {
    body = await request.json();
  } catch (e) { console.error(e);
    // empty body is ok (sync all with default params)
  }

  try {
    let results;

    if (body.all) {
      results = await syncAllBusinessUnits(body.providerId);
      const flatResults = results.flat();

      after(() => {
        try {
          revalidateTag("analytics", "max");
        } catch (e) { console.error(e);
          // revalidateTag may not be available in all environments
        }
      });

      return NextResponse.json({
        success: true,
        results: flatResults,
        syncedUnits: results.length,
      });
    }

    if (!body.businessUnitId) {
      const units = await db.getBusinessUnits().catch(() => []);
      const unitList = (units as Array<{ id: string; name: string }>).map(
        (u) => ({ id: u.id, name: u.name }),
      );
      return NextResponse.json({
        error: "businessUnitId e obrigatorio (ou use all: true)",
        availableUnits: unitList,
      }, { status: 400 });
    }

    results = await syncBusinessUnit({
      businessUnitId: body.businessUnitId,
      providerId: body.providerId,
      isManual: true,
    });

    after(() => {
      try {
        revalidateTag("analytics", "max");
      } catch (e) { console.error(e);
        // ignore
      }
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Erro na sincronizacao", details: msg },
      { status: 500 },
    );
  }
}
