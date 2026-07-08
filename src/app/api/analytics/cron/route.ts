import { NextRequest, NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import { syncAllBusinessUnits } from "@/lib/analytics/sync";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET nao configurado" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const results = await syncAllBusinessUnits();

    after(() => {
      try {
        revalidateTag("analytics", "max");
      } catch {
        // ignore
      }
    });

    const flatResults = results.flat();
    const successCount = flatResults.filter((r) => r.status === "success").length;
    const errorCount = flatResults.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      totalProviders: flatResults.length,
      successCount,
      errorCount,
      results: flatResults,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Erro no cron de sincronizacao", details: msg },
      { status: 500 },
    );
  }
}
