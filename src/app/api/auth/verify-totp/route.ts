import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateTotpSecret, verifyTotp, getTotpUri } from "@/lib/mfa";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const action = body.action as string | undefined;

    if (action === "setup") {
      const secret = generateTotpSecret();
      const userEmail = session.user.email ?? "usuario@centralazul.com.br";
      const uri = getTotpUri(userEmail, secret);
      return NextResponse.json({ secret, uri });
    }

    if (action === "enable") {
      const { secret, totpCode } = body as { secret: string; totpCode: string };
      if (!secret || !totpCode) {
        return NextResponse.json(
          { error: "Secret e codigo TOTP sao obrigatorios" },
          { status: 400 },
        );
      }
      if (!verifyTotp(totpCode, secret)) {
        return NextResponse.json(
          { error: "Codigo TOTP invalido" },
          { status: 400 },
        );
      }
      await db.setUserMfa(userId, secret, true);
      return NextResponse.json({ success: true });
    }

    if (action === "disable") {
      await db.setUserMfa(userId, "", false);
      return NextResponse.json({ success: true });
    }

    if (action === "verify") {
      const { totpCode } = body as { totpCode: string };
      if (!totpCode) {
        return NextResponse.json(
          { error: "Codigo TOTP e obrigatorio" },
          { status: 400 },
        );
      }
      const userMfa = await db.getUserMfa(userId);
      if (!userMfa || !userMfa.enabled) {
        return NextResponse.json(
          { error: "MFA nao configurado para este usuario" },
          { status: 400 },
        );
      }
      if (!verifyTotp(totpCode, userMfa.secret)) {
        return NextResponse.json(
          { error: "Codigo TOTP invalido" },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Acao invalida. Use: setup, enable, disable, ou verify" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Erro no verify-totp:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const userMfa = await db.getUserMfa(session.user.id);
    return NextResponse.json({
      enabled: userMfa?.enabled ?? false,
    });
  } catch (error) {
    console.error("Erro ao buscar status MFA:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
