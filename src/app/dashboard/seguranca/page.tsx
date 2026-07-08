import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SegurancaClient from "./SegurancaClient";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  hierarchyLevel: number;
  status: string;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

interface RoleConfig {
  id: string;
  name: string;
  displayName: string;
  hierarchyLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MenuPermissionItem {
  href: string;
  name: string;
  minLevel: number;
}

interface LevelItem {
  id: string;
  level: number;
  name: string;
  createdAt: Date;
}

interface SystemConfig {
  restrictDomain: boolean;
  mfaRequired: boolean;
  sessionTimeout: boolean;
}

export default async function SegurancaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id?: string;
    role?: string;
    hierarchyLevel?: number;
  };

  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;
  const currentUserId = user?.id || "";

  // Fetch all security data server-side in parallel
  const [usersData, logsData, rolesData, menuPermissionsData, levelsData] = await Promise.all([
    db.getUsers().catch(() => []),
    db.getAuditLogs(userLevel).catch(() => []),
    db.getRoles().catch(() => []),
    db.getMenuPermissions().catch(() => []),
    db.getLevels().catch(() => []),
  ]);

  // Fetch system config
  let config: SystemConfig = {
    restrictDomain: true,
    mfaRequired: true,
    sessionTimeout: false,
  };

  try {
    const [restrictDomain, mfaRequired, sessionTimeout] = await Promise.all([
      db.getSystemConfig("restrictDomain").catch(() => "true"),
      db.getSystemConfig("mfaRequired").catch(() => "true"),
      db.getSystemConfig("sessionTimeout").catch(() => "false"),
    ]);

    config = {
      restrictDomain: restrictDomain === "true",
      mfaRequired: mfaRequired === "true",
      sessionTimeout: sessionTimeout === "true",
    };
  } catch {
    // Use defaults
  }

  // Serialize dates for client component
  const serializedUsers = (usersData as UserItem[]).map((u) => ({
    id: u.id,
    name: u.name || "",
    email: u.email || "",
    image: u.image || "",
    role: u.role,
    hierarchyLevel: u.hierarchyLevel,
    status: u.status,
    createdAt: new Date(u.createdAt).toISOString(),
  }));

  const serializedLogs = (logsData as AuditLog[]).map((log) => ({
    id: log.id,
    userId: log.userId,
    userName: log.userName,
    action: log.action,
    details: log.details,
    ipAddress: log.ipAddress || "",
    userAgent: log.userAgent || "",
    createdAt: new Date(log.createdAt).toISOString(),
  }));

  const serializedRoles = (rolesData as RoleConfig[]).map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    hierarchyLevel: r.hierarchyLevel,
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));

  const serializedMenuPermissions = (menuPermissionsData as MenuPermissionItem[]).map((mp) => ({
    href: mp.href,
    name: mp.name,
    minLevel: mp.minLevel,
  }));

  const serializedLevels = (levelsData as LevelItem[]).map((l) => ({
    id: l.id,
    level: l.level,
    name: l.name,
    createdAt: new Date(l.createdAt).toISOString(),
  }));

  return (
    <SegurancaClient
      initialUsers={serializedUsers}
      initialLogs={serializedLogs}
      initialRoles={serializedRoles}
      initialMenuPermissions={serializedMenuPermissions}
      initialLevels={serializedLevels}
      initialConfig={config}
      userLevel={userLevel}
      userRole={userRole}
      currentUserId={currentUserId}
    />
  );
}
