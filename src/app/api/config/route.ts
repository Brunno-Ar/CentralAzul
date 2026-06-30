import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SessionUser } from "@/types/auth";
import { prisma, isDatabaseConnected } from "@/lib/db";

// Fallback mock store
declare global {
  var __mockSystemConfig: Record<string, string> | undefined;
}
const mockConfig = globalThis.__mockSystemConfig ?? (globalThis.__mockSystemConfig = {
  restrictDomain: "true",
  mfaRequired: "true",
  sessionTimeout: "false",
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as SessionUser).hierarchyLevel !== 1) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (prisma && isDatabaseConnected()) {
      const configs = await prisma.systemConfig.findMany();
      const result: Record<string, string> = {};
      configs.forEach((c: { key: string; value: string }) => result[c.key] = c.value);
      
      // Merge with defaults if not found
      if (!result.restrictDomain) result.restrictDomain = mockConfig.restrictDomain;
      if (!result.mfaRequired) result.mfaRequired = mockConfig.mfaRequired;
      if (!result.sessionTimeout) result.sessionTimeout = mockConfig.sessionTimeout;

      return NextResponse.json(result);
    }
    
    return NextResponse.json(mockConfig);
  } catch (error) {
    console.error("GET Config Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as SessionUser).hierarchyLevel !== 1) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();

    if (prisma && isDatabaseConnected()) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") {
          await prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value }
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    // Mock
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        mockConfig[key] = value;
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT Config Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
