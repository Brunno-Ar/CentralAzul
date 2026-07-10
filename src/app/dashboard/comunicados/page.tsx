import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Company } from "@prisma/client";
import ComunicadosClient from "./ComunicadosClient";

export default async function ComunicadosPage() {
  const session = await auth();
  const user = session?.user as
    | {
        id?: string;
        name?: string | null;
        role?: string;
        hierarchyLevel?: number;
        company?: Company;
      }
    | undefined;

  const userId = user?.id || "";
  const userLevel = user?.hierarchyLevel || 3;
  const companySlug = typeof user?.company === "object" && user?.company ? (user.company as any).slug : user?.company;

  // Fetch announcements server-side
  const [announcementsData, readsData] = await Promise.all([
    db.getAnnouncements(userLevel, companySlug).catch(() => []),
    db.getAnnouncementReadsByUser(userId).catch(() => []),
  ]);

  const readIds = new Set(
    (readsData as Array<{ announcementId: string }>).map((r) => r.announcementId),
  );

  // Serialize dates and add read status
  const serializedAnnouncements = (
    announcementsData as Array<{
      id: string;
      title: string;
      content: string;
      priority: string;
      targetCompanies: string;
      expiresAt: Date | null;
      isPinned: boolean;
      isActive: boolean;
      createdById: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  ).map((ann) => ({
    id: ann.id,
    title: ann.title,
    content: ann.content,
    priority: ann.priority,
    targetCompanies: ann.targetCompanies,
    expiresAt: ann.expiresAt ? new Date(ann.expiresAt).toISOString() : null,
    isPinned: ann.isPinned,
    isActive: ann.isActive,
    createdById: ann.createdById,
    createdAt: new Date(ann.createdAt).toISOString(),
    updatedAt: new Date(ann.updatedAt).toISOString(),
    read: readIds.has(ann.id),
  }));

  return (
    <ComunicadosClient
      initialAnnouncements={serializedAnnouncements}
      userLevel={userLevel}
      userId={userId}
    />
  );
}
