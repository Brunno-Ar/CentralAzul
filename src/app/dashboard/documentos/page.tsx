import { auth } from "@/auth";
import { db } from "@/lib/db";
import DocumentosClient from "./DocumentosClient";

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: string;
  minHierarchyLevel: number;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export default async function DocumentosPage() {
  const session = await auth();
  const user = session?.user as
    | {
        name?: string | null;
        role?: string;
        hierarchyLevel?: number;
        company?: string;
      }
    | undefined;

  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;
  const userCompany = user?.company;
  const isUploadAllowed = userRole === "ADMIN" || userRole === "COORDINATOR";

  const documents: DocumentItem[] = (await db
    .getDocuments(userLevel, userCompany)
    .catch(() => [])) as DocumentItem[];

  // Serialize dates for client component
  const serializedDocs = documents.map((doc) => ({
    ...doc,
    createdAt: new Date(doc.createdAt).toISOString(),
  }));

  return (
    <DocumentosClient
      documents={serializedDocs}
      isUploadAllowed={isUploadAllowed}
      userLevel={userLevel}
    />
  );
}
