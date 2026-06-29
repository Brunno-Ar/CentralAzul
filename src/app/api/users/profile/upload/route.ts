import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadToB2 } from "@/lib/b2";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";

async function handlePost(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !(session.user as SessionUser).id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Limit avatar size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "A foto de perfil deve ter no maximo 5MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to B2 or mock fallback
    const uploadResult = await uploadToB2(buffer, file.name, file.type);

    // Update user profile picture in DB
    const updatedUser = await db.updateUserProfile(userId, { image: uploadResult.url });
    if (!updatedUser) {
      return NextResponse.json({ error: "Erro ao salvar foto de perfil no banco" }, { status: 500 });
    }

    // Log the security event
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      userId,
      "ALTERAR_PERFIL_FOTO",
      `Alterou a foto de perfil por upload de arquivo.`,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.url,
    });
  } catch (error) {
    console.error("Erro no upload da foto de perfil:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao processar upload" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handlePost(request);
}
