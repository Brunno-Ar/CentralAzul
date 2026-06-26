import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToB2 } from "@/lib/b2";
import { dbSim } from "@/lib/db";
import { Company } from "@prisma/client";
import { SessionUser } from "@/types/auth";

export async function POST(request: NextRequest) {
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
    const minHierarchyLevel = parseInt((formData.get("minHierarchyLevel") as string) || "3", 10);
    const customFileType = formData.get("fileType") as string | null;

    if (!title) {
      return NextResponse.json(
        { error: "Titulo e obrigatorio" },
        { status: 400 }
      );
    }

    let fileUrl = "";
    let fileSize = 0;
    let fileType = "";

    if (isExternal) {
      if (!externalUrl) {
        return NextResponse.json(
          { error: "URL externa e obrigatoria para links" },
          { status: 400 }
        );
      }
      fileUrl = externalUrl;
      fileType = customFileType || "link";
      fileSize = 0;
    } else {
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "Arquivo e obrigatorio" },
          { status: 400 }
        );
      }
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Backblaze B2 (or local mock fallback)
      const uploadResult = await uploadToB2(buffer, file.name, file.type);
      fileUrl = uploadResult.url;
      fileSize = uploadResult.size;
      fileType = file.type;
    }

    // Save document to DB
    const newDoc = await dbSim.addDocument({
      title,
      description: description || "",
      fileUrl,
      fileSize,
      fileType,
      category,
      minHierarchyLevel,
      uploadedById: userId,
    });

    // Log the security event
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await dbSim.addLog(
      userId,
      "UPLOAD_DOCUMENT",
      isExternal 
        ? `Link externo '${title}' (${fileType}) registrado com sucesso para ${category}.`
        : `Documento '${title}' (${fileType}) enviado com sucesso para ${category} no bucket B2.`,
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
