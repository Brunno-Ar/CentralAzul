import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToB2 } from "@/lib/b2";
import { db } from "@/lib/db";
import { Company } from "@prisma/client";
import { SessionUser } from "@/types/auth";
import { createDocumentSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { validateExternalUrl } from "@/lib/ssrf";
import { randomUUID } from "crypto";

// Max file size: 10GB
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;

// MIME type allowlist
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png", 
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
];

// Magic number signatures for file type validation
const MAGIC_NUMBERS: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF + WEBP
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "video/mp4": [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]], // ftyp box
  "video/webm": [[0x1a, 0x45, 0xdf, 0xa3]], // EBML (WebM/MKV)
};

// Sanitize filename: strip path traversal, null bytes, shell metacharacters, limit to 255 chars, generate UUID-based name
function sanitizeFilename(originalName: string): string {
  // Strip directory traversal attempts
  let clean = originalName
    .replace(/\.\.\//g, "")     // ../
    .replace(/\.\.\\/g, "")     // ..\
    .replace(/\0/g, "")         // null bytes
    .replace(/[<>:"|?*]/g, "")  // shell metacharacters
    .replace(/[`$\\]/g, "");    // additional shell chars

  // Limit total length
  if (clean.length > 255) {
    clean = clean.substring(0, 255);
  }

  // Extract extension
  const lastDot = clean.lastIndexOf(".");
  const ext = lastDot !== -1 ? clean.substring(lastDot) : "";
  void clean;

  // Generate UUID-based filename to prevent collisions and hide original name
  const uuid = randomUUID();
  return `${uuid}${ext}`;
}

// Validate magic numbers (file signatures) against buffer
function validateMagicNumber(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_NUMBERS[mimeType];
  if (!signatures) {
    return false; // Unknown MIME type
  }

  // Check each possible signature for this MIME type
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
  const limiterResponse = await rateLimit(request, "upload");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user || !(session.user as SessionUser).id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const userRole = (session.user as SessionUser).role;
    
    // Coordinators or Admins can upload files
    if (userRole !== "ADMIN" && userRole !== "COORDINATOR") {
      return NextResponse.json(
        { error: "Nivel de permissao insuficiente para upload" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const isExternal = formData.get("isExternal") === "true";
    const externalUrl = formData.get("externalUrl") as string | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const category = (formData.get("category") as Company | null) || Company.CENTRAL;
    
    // Only Level 1 users can set a minimum hierarchy level other than 3
    const sessionLevel = (session.user as SessionUser).hierarchyLevel;
    let minHierarchyLevel = 3;
    if (sessionLevel === 1) {
      minHierarchyLevel = parseInt((formData.get("minHierarchyLevel") as string) || "3", 10);
    }

    const customFileType = formData.get("fileType") as string | null;

    // Validate with Zod for external links
    if (isExternal) {
      const validationData = {
        title: title || "",
        description: description || "",
        fileUrl: externalUrl || "",
        fileSize: 0,
        fileType: customFileType || "link",
        type: "link" as const,
        category,
        minHierarchyLevel,
      };

      const validation = createDocumentSchema.safeParse(validationData);
      if (!validation.success) {
        const errorMessages = validation.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        ).join("; ");
        return NextResponse.json(
          { error: "Dados inválidos", details: errorMessages },
          { status: 400 }
        );
      }

      if (!externalUrl) {
        return NextResponse.json(
          { error: "URL externa e obrigatoria para links" },
          { status: 400 }
        );
      }

      // Validate external URL to prevent SSRF
      if (!validateExternalUrl(externalUrl)) {
        return NextResponse.json(
          { error: "URL externa invalida ou bloqueada por seguranca" },
          { status: 400 }
        );
      }
    } else {
      // Validate title for file uploads
      if (!title) {
        return NextResponse.json(
          { error: "Titulo e obrigatorio" },
          { status: 400 }
        );
      }

      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "Arquivo e obrigatorio" },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Arquivo muito grande. Tamanho maximo: 10GB` },
          { status: 400 }
        );
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo de arquivo nao permitido. Tipos aceitos: ${ALLOWED_MIME_TYPES.join(", ")}` },
          { status: 400 }
        );
      }

      // Validate magic number (file signature)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (!validateMagicNumber(buffer, file.type)) {
        return NextResponse.json(
          { error: "Arquivo invalido: assinatura do arquivo nao corresponde ao tipo declarado" },
          { status: 400 }
        );
      }
    }

    let fileUrl = "";
    let fileSize = 0;
    let fileType = "";

    if (isExternal) {
      fileUrl = externalUrl!;
      fileType = customFileType || "link";
      fileSize = 0;
    } else {
      const file = formData.get("file") as File;
      // Convert file to buffer (already done for magic number validation, but need to re-read)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Sanitize filename before upload
      const sanitizedName = sanitizeFilename(file.name);

      // Upload to Backblaze B2 (or local mock fallback)
      const uploadResult = await uploadToB2(buffer, sanitizedName, file.type);
      fileUrl = uploadResult.url;
      fileSize = uploadResult.size;
      fileType = file.type;
    }

    // Save document to DB
    const newDoc = await db.addDocument({
      title: title!,
      description: description || "",
      fileUrl,
      fileSize,
      fileType,
      category,
      minHierarchyLevel,
      uploadedById: userId,
    });

    // Log the security event (using user-friendly language)
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      userId,
      "UPLOAD_DOCUMENT",
      isExternal 
        ? `Link externo '${title}' (${fileType}) registrado com sucesso para ${category}.`
        : `Documento '${title}' (${fileType}) enviado com sucesso para ${category} no Armazenamento local.`,
      ip,
      userAgent
    );

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error("Erro no processamento do upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar requisicao" },
      { status: 500 }
    );
  }
}