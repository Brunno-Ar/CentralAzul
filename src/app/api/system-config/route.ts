import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SessionUser } from "@/types/auth";
import { prisma, isDatabaseConnected } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session?.user || (session.user as SessionUser).hierarchyLevel !== 1) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    if (prisma && isDatabaseConnected()) {
      const configs = await prisma.systemConfig.findMany();
      const result: Record<string, string> = {};
      configs.forEach((c) => {
        result[c.key] = c.value;
      });
      return NextResponse.json(result);
    }

    const mockStore = globalThis.__mockSystemConfig ?? {};
    return NextResponse.json(mockStore);
  } catch (error) {
    console.error("GET System Config Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "CSRF token invalido" }, { status: 403 });
  }

  try {
    const session = await auth();
    if (!session?.user || (session.user as SessionUser).hierarchyLevel !== 1) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const data = await request.json();

    if (prisma && isDatabaseConnected()) {
      for (const [key, value] of Object.entries(data)) {
        const strValue = String(value);
        await prisma.systemConfig.upsert({
          where: { key },
          update: { value: strValue },
          create: { key, value: strValue },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (!globalThis.__mockSystemConfig) {
      globalThis.__mockSystemConfig = {};
    }
    for (const [key, value] of Object.entries(data)) {
      globalThis.__mockSystemConfig[key] = String(value);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT System Config Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
