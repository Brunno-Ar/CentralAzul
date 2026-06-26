import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim, MockDocument, MockSystemPanel, MockUser } from "@/lib/db";
import { SessionUser } from "@/types/auth";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  tags?: string[];
  fileType?: string | null;
  external?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase().trim() || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;

    // Buscar em paralelo (sem quicklinks)
    const [documents, panels, users] = await Promise.all([
      dbSim.getDocuments?.() || [],
      dbSim.getPanels?.() || [],
      dbSim.getUsers?.() || [],
    ]);

    const results: SearchResult[] = [];

    // Documentos - filtrar por hierarquia
    const filteredDocs = (documents as MockDocument[])
      .filter((doc: MockDocument) => userLevel <= doc.minHierarchyLevel)
      .filter(
        (doc: MockDocument) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query),
      )
      .slice(0, limit);

    for (const doc of filteredDocs) {
      results.push({
        id: doc.id,
        type: "document",
        title: doc.title,
        description: doc.description || `Documento • ${doc.category}`,
        url: `/dashboard/documentos/${doc.id}`,
        icon: "FileText",
        category: doc.category,
        fileType: doc.fileType,
      });
    }

    // Ferramentas/Paineis - filtrar por hierarquia
    const filteredPanels = (panels as MockSystemPanel[])
      .filter(
        (panel: MockSystemPanel) =>
          panel.isActive && userLevel <= panel.minHierarchy,
      )
      .filter(
        (panel: MockSystemPanel) =>
          panel.name.toLowerCase().includes(query) ||
          panel.description.toLowerCase().includes(query),
      )
      .slice(0, limit);

    for (const panel of filteredPanels) {
      results.push({
        id: panel.id,
        type: "panel",
        title: panel.name,
        description: panel.description,
        url: panel.url,
        icon: panel.icon,
        category: panel.category,
        external: panel.url.startsWith("http"),
      });
    }

    // Usuários (apenas para admins/gerentes)
    if (userLevel <= 2) {
      const filteredUsers = (users as MockUser[])
        .filter(
          (u: MockUser) =>
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query),
        )
        .slice(0, 5);

      for (const u of filteredUsers) {
        results.push({
          id: u.id,
          type: "user",
          title: u.name,
          description: `${u.email} • ${u.role} (Nível ${u.hierarchyLevel})`,
          url: `/dashboard/equipe/${u.id}`,
          icon: "User",
          category: u.company,
        });
      }
    }

    // Ordenar por relevância (exatos primeiro, depois parciais)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query;
      const bExact = b.title.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return NextResponse.json({ results: results.slice(0, limit) });
  } catch (error) {
    console.error("Erro na busca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
