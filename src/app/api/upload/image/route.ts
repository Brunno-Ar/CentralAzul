import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToB2 } from "@/lib/b2";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAGIC_NUMBERS: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF + WEBP
};

function validateMagicNumber(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_NUMBERS[mimeType];
  if (!signatures) return false;
  for (const signature of signatures) {
    if (buffer.length >= signature.length) {
      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    if (user.hierarchyLevel > 2) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "A imagem deve ter no máximo 5MB" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Formato de arquivo não permitido (apenas JPEG, PNG, WEBP)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!validateMagicNumber(buffer, file.type)) {
      return NextResponse.json({ error: "Arquivo inválido (assinatura do arquivo não corresponde ao tipo)" }, { status: 400 });
    }

    const uploadResult = await uploadToB2(buffer, file.name, file.type);
    return NextResponse.json({ imageUrl: uploadResult.url });
  } catch (error) {
    console.error("Erro no upload da imagem:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
