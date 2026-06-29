import { NextRequest, NextResponse } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
    }

    const dbUser = await db.getUserById(userId);
    if (!dbUser) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const cookieNames = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
    ];

    const cookieStore = await cookies();
    let foundCookieName = "";
    let foundCookieValue = "";

    for (const name of cookieNames) {
      const cookie = cookieStore.get(name);
      if (cookie?.value) {
        foundCookieName = name;
        foundCookieValue = cookie.value;
        break;
      }
    }

    if (!foundCookieName || !foundCookieValue) {
      return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 401 });
    }

    const token = await decode({
      token: foundCookieValue,
      secret: process.env.AUTH_SECRET || "",
      salt: foundCookieName,
    });

    if (!token) {
      return NextResponse.json({ error: "Falha ao decodificar sessao" }, { status: 401 });
    }

    // Security check: Only allow users to refresh their own session token
    if (token.id !== userId && token.sub !== userId) {
      return NextResponse.json({ error: "Acesso negado. Voce nao pode atualizar a sessao de outro usuario." }, { status: 403 });
    }

    token.role = dbUser.role;
    token.hierarchyLevel = dbUser.hierarchyLevel;
    token.company = dbUser.company;
    token.status = dbUser.status;
    token.name = dbUser.name;

    const encodedToken = await encode({
      token,
      secret: process.env.AUTH_SECRET || "",
      salt: foundCookieName,
    });

    const response = NextResponse.json({ success: true, user: dbUser });
    response.cookies.set(foundCookieName, encodedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no refresh-role:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
