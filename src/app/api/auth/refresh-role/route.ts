import { NextRequest, NextResponse } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { validateRequest, refreshRoleBodySchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const validation = await validateRequest(request, refreshRoleBodySchema);
    if (!validation.success) {
      return validation.error;
    }

    const userId = session.user.id;

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
    token.picture = dbUser.image;

    const encodedToken = await encode({
      token,
      secret: process.env.AUTH_SECRET || "",
      salt: foundCookieName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image,
        role: dbUser.role,
        hierarchyLevel: dbUser.hierarchyLevel,
        company: dbUser.company,
        status: dbUser.status,
      },
    });
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
