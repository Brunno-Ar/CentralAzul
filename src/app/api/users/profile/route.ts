import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateRequest, updateProfileSchema } from "@/lib/validation";

async function handlePut(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    const currentUser = session.user as SessionUser;

    const validation = await validateRequest(request, updateProfileSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name, image, currentPassword, newPassword } = validation.data;

    // Fetch full user details to check the password
    const userFromDb = await db.getUserById(currentUser.id);
    if (!userFromDb) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const updates: { name?: string; image?: string; password?: string } = {};

    if (name) updates.name = name;
    if (image) updates.image = image;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "A senha atual e necessaria para alterar a senha" }, { status: 400 });
      }
      if (!userFromDb.password || !(await bcrypt.compare(currentPassword, userFromDb.password))) {
        return NextResponse.json({ error: "A senha atual informada esta incorreta" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
      }
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nenhum dado informado para atualizacao" }, { status: 400 });
    }

    const updatedUser = await db.updateUserProfile(currentUser.id, updates);
    if (!updatedUser) {
      return NextResponse.json({ error: "Erro ao atualizar no banco de dados" }, { status: 500 });
    }

    // Log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      currentUser.id,
      "ALTERAR_PERFIL",
      `Atualizou o perfil individual (${Object.keys(updates).join(", ")})`,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuario:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handlePut(request);
}
