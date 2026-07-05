"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SessionUser } from "@/types/auth";
import { useSession, signOut } from "next-auth/react";
import {
  Shield, LogOut, FileText, ShieldAlert, Grid, User, Sliders,
  Bell, Building2, LayoutGrid, ChevronRight, Menu, X,
} from "lucide-react";

/* ============================================================
   NAV ITEMS CONFIG
   ============================================================ */
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minLevel: number;
  badge?: number;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Grid, minLevel: 3 },
  { name: "Ferramentas", href: "/dashboard/ferramentas", icon: Sliders, minLevel: 3 },
  { name: "Comunicados", href: "/dashboard/comunicados", icon: Bell, minLevel: 3 },
  { name: "Unidades", href: "/dashboard/unidades", icon: Building2, minLevel: 3 },
  { name: "Documentos", href: "/dashboard/documentos", icon: FileText, minLevel: 3 },
  { name: "Empresas", href: "/dashboard/empresas", icon: LayoutGrid, minLevel: 1 },
  { name: "Seguranca", href: "/dashboard/seguranca", icon: ShieldAlert, minLevel: 1 },
  { name: "Configuracoes", href: "/dashboard/configuracoes", icon: User, minLevel: 99 },
];

/* ============================================================
   DESKTOP SIDEBAR
   ============================================================ */
function DesktopSidebar({
  user,
  userLevel,
  userRole,
  unreadCount,
}: {
  user: SessionUser | undefined;
  userLevel: number;
  userRole: string;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const isOpen = collapsed ? isHovering : true;
  const filteredItems = navItems.filter((item) => userLevel <= item.minLevel);

  return (
    <motion.aside
      className="hidden md:flex flex-col h-screen bg-white border-r border-brand-terciar/10 sticky top-0 will-change-[width] transform-gpu"
      style={{ width: isOpen ? 256 : 64 }}
      animate={{ width: isOpen ? 256 : 64 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-primary shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <motion.div
          className="overflow-hidden"
          initial={{ maxWidth: "0px", opacity: 0 }}
          animate={{
            maxWidth: isOpen ? "200px" : "0px",
            opacity: isOpen ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <span className="text-sm font-bold text-brand-foreground block truncate whitespace-nowrap">
            Central Azul
          </span>
          <span className="text-[10px] text-brand-foreground-subtle uppercase tracking-wider block whitespace-nowrap">
            Grupo Azul
          </span>
        </motion.div>
      </div>

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-4 mb-2 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-brand-surface-alt transition-colors self-end"
        title={isOpen ? "Recolher" : "Expandir"}
      >
        <ChevronRight
          className={cn("w-4 h-4 text-brand-foreground-subtle transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-brand-foreground-muted hover:bg-brand-surface-alt hover:text-brand-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-brand-primary" : "text-brand-foreground-subtle group-hover:text-brand-foreground")} />
                {item.href === "/dashboard/comunicados" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <motion.span
                className="truncate whitespace-nowrap inline-block"
                initial={{ maxWidth: "0px", opacity: 0 }}
                animate={{
                  maxWidth: isOpen ? "200px" : "0px",
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {item.name}
              </motion.span>
              {isOpen && isActive && (
                <motion.div layoutId="sidebarActive" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className={cn("p-3 border-t border-brand-terciar/10", !isOpen && "px-2")}>
        <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
          {user?.image ? (
            <img src={user.image} alt={user.name || "User"} className="w-8 h-8 rounded-full object-cover border border-brand-terciar/10 shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-surface-alt flex items-center justify-center border border-brand-terciar/10 shrink-0">
              <User className="w-4 h-4 text-brand-foreground-subtle" />
            </div>
          )}
          <motion.div
            className="flex-1 min-w-0 overflow-hidden"
            initial={{ maxWidth: "0px", opacity: 0 }}
            animate={{
              maxWidth: isOpen ? "200px" : "0px",
              opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <p className="text-xs font-semibold text-brand-foreground truncate whitespace-nowrap">{user?.name || "Colaborador"}</p>
            <p className="text-[10px] text-brand-foreground-subtle truncate whitespace-nowrap">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-mono font-bold whitespace-nowrap">
                {userRole}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-surface-alt text-brand-foreground-subtle font-mono whitespace-nowrap">
                N{userLevel}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "mt-2 flex items-center gap-2 text-xs font-medium text-error hover:bg-error-light rounded-xl transition-colors",
            !isOpen ? "justify-center w-10 h-10 mx-auto" : "w-full px-3 py-2"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <motion.span
            className="whitespace-nowrap inline-block"
            initial={{ maxWidth: "0px", opacity: 0 }}
            animate={{
              maxWidth: isOpen ? "200px" : "0px",
              opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            Sair
          </motion.span>
        </button>
      </div>
    </motion.aside>
  );
}

/* ============================================================
   MOBILE HEADER + DRAWER
   ============================================================ */
function MobileHeader({
  user,
  userLevel,
  userRole,
  unreadCount,
}: {
  user: SessionUser | undefined;
  userLevel: number;
  userRole: string;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredItems = navItems.filter((item) => userLevel <= item.minLevel);

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-brand-terciar/10 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-brand-foreground">Central Azul</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg hover:bg-brand-surface-alt transition-colors"
        >
          <Menu className="w-5 h-5 text-brand-foreground" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={() => setDrawerOpen(false)} />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 shadow-xl md:hidden flex flex-col"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-brand-foreground">Menu</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-brand-surface-alt">
                <X className="w-5 h-5 text-brand-foreground" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-brand-terciar/10">
              <div className="flex items-center gap-3">
                {user?.image ? (
                  <img src={user.image} alt={user.name || "User"} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-surface-alt flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-foreground-subtle" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-brand-foreground">{user?.name || "Colaborador"}</p>
                  <p className="text-xs text-brand-foreground-subtle">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-mono font-bold">
                  {userRole}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-surface-alt text-brand-foreground-subtle font-mono">
                  N{userLevel}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {filteredItems.map
((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-brand-foreground-muted hover:bg-brand-surface-alt hover:text-brand-foreground"
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn("w-5 h-5", isActive ? "text-brand-primary" : "text-brand-foreground-subtle")} />
                      {item.href === "/dashboard/comunicados" && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>{item.name}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-brand-terciar/10">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-error hover:bg-error-light rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Portal</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}

/* ============================================================
   MAIN NAV COMPONENT
   ============================================================ */
export default function DashboardNav() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const userRole = user?.role || "VIEW";
  const userLevel = user?.hierarchyLevel || 3;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          const count = data.filter((a: { read: boolean }) => !a.read).length;
          setUnreadCount(count);
        }
      } catch {
        // Silently fail
      }
    };
    fetchUnread();
  }, []);

  return (
    <>
      <DesktopSidebar user={user} userLevel={userLevel} userRole={userRole} unreadCount={unreadCount} />
      <MobileHeader user={user} userLevel={userLevel} userRole={userRole} unreadCount={unreadCount} />
    </>
  );
}
