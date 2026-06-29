import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { 
  validateRequest, 
  validateSearchParams, 
  paginationSchema, 
  updateUserSchema 
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

async function handleGet(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const userLevel = (session.user as SessionUser).hierarchyLevel ?? 99;
    if (userLevel > 2) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores e gerentes." },
        { status: 403 },
      );
    }

    // Validate pagination params
    const paginationValidation = validateSearchParams(
      request.nextUrl.searchParams,
      paginationSchema
    );
    if (!paginationValidation.success) {
      return paginationValidation.error;
    }

    const users = await db.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao carregar usuarios:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

async function handlePut(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel ?? 99;
    if (userLevel > 2) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores e gerentes." },
        { status: 403 },
      );
    }

    // Validate request body with Zod
    const validation = await validateRequest(request, updateUserSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { userId, role, status } = validation.data;

    // Resolve hierarchyLevel matching the selected role config
    const rolesList = await db.getRoles();
    const selectedRole = rolesList.find((r) => r.name === role);
    const resolvedLevel = selectedRole ? selectedRole.hierarchyLevel : 3;

    // Security check: cannot assign a hierarchyLevel superior (numerically smaller) to caller's own level
    if (resolvedLevel < userLevel) {
      return NextResponse.json(
        { error: "Acesso negado. Voce nao pode atribuir um nivel de hierarquia superior ao seu." },
        { status: 403 }
      );
    }

    // Perform update
    const updatedUser = await db.updateUserHierarchy(
      userId,
      role as string,
      resolvedLevel,
      status,
    );

    // Refresh role in JWT session ONLY if updating own session
    let refreshRes: Response | null = null;
    if (userId === user.id) {
      try {
        refreshRes = await fetch(new URL("/api/auth/refresh-role", request.url), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("cookie") || "",
          },
          body: JSON.stringify({ userId }),
        });
      } catch (e) {
        console.error("Erro ao atualizar JWT do usuario:", e);
      }
    }

    // Audit log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";

    await db.addLog(
      user.id,
      "ALTERAR_HIERARQUIA",
      `Alterou permissao do usuario ${updatedUser?.email || userId} para Role: ${role}, Nivel: ${resolvedLevel}, Status: ${status || "ACTIVE"}.`,
      ip,
      userAgent,
    );

    const response = NextResponse.json(updatedUser);
    if (refreshRes && refreshRes.headers.get("set-cookie")) {
      response.headers.set("set-cookie", refreshRes.headers.get("set-cookie")!);
    }
    return response;
  } catch (error) {
    console.error("Erro ao atualizar usuario:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

async function handlePost(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const caller = session.user as SessionUser;
    const callerLevel = caller.hierarchyLevel ?? 99;
    if (callerLevel !== 1) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores do Nível 1 podem criar contas." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 },
      );
    }

    // Resolve hierarchyLevel matching the selected role config
    const rolesList = await db.getRoles();
    const selectedRole = rolesList.find((r) => r.name === role);
    const resolvedLevel = selectedRole ? selectedRole.hierarchyLevel : 3;

    // Check if user already exists
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Um colaborador com este e-mail já está cadastrado." },
        { status: 400 },
      );
    }

    const newUser = await db.createUser({
      name,
      email: email.toLowerCase().trim(),
      role,
      hierarchyLevel: resolvedLevel,
      company: caller.company || "CENTRAL",
      password,
    });

    // Audit log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      caller.id,
      "CRIAR_USUARIO",
      `Criou a conta do colaborador ${email} com Cargo: ${role}, Nível: ${resolvedLevel}.`,
      ip,
      userAgent,
    );

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// Use method-aware rate limiting
export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;
  return handleGet(request);
}

export async function PUT(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handlePut(request);
}

export async function POST(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handlePost(request);
}
