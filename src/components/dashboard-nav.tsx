"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { SessionUser } from "@/types/auth";
import {
  Shield,
  LogOut,
  FileText,
  ShieldAlert,
  Grid,
  User,
  Sliders,
  Bell,
  Building2,
  LayoutGrid,
} from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

export default function DashboardNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = session?.user as SessionUser | undefined;
  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;

  // Fetch unread announcements count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          const count = data.filter((a: { read: boolean }) => !a.read).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Erro ao buscar contagem de não lidos:", err);
      }
    };
    fetchUnread();
  }, []);

  const [menuPermissions, setMenuPermissions] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch("/api/menu-permissions");
        if (res.ok) {
          const data = await res.json();
          const mappings: Record<string, number> = {};
          data.forEach((p: { href: string; minLevel: number }) => {
            mappings[p.href] = p.minLevel;
          });
          setMenuPermissions(mappings);
        }
      } catch (err) {
        console.error("Erro ao buscar permissoes do menu:", err);
      }
    };
    fetchPermissions();
  }, []);

  const navItems = [
    {
      name: "Painel Principal",
      href: "/dashboard",
      icon: Grid,
      allowedRoles: ["ADMIN", "COORDINATOR", "VIEWER"],
      minLevel: 3,
    },
    {
      name: "Ferramentas",
      href: "/dashboard/ferramentas",
      icon: Sliders,
      allowedRoles: ["ADMIN", "COORDINATOR", "VIEWER"],
      minLevel: 3,
    },
    {
      name: "Comunicados",
      href: "/dashboard/comunicados",
      icon: Bell,
      allowedRoles: ["ADMIN", "COORDINATOR", "VIEWER"],
      minLevel: 3,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: "Unidades de Negócio",
      href: "/dashboard/unidades",
      icon: Building2,
      allowedRoles: ["ADMIN", "COORDINATOR", "VIEWER"],
      minLevel: 3,
    },
    {
      name: "Drive de Arquivos",
      href: "/dashboard/documentos",
      icon: FileText,
      allowedRoles: ["ADMIN", "COORDINATOR", "VIEWER"],
      minLevel: 3,
    },
    {
      name: "Empresas & Ferramentas",
      href: "/dashboard/empresas",
      icon: LayoutGrid,
      allowedRoles: ["ADMIN"],
      minLevel: 1,
    },
    {
      name: "Seguranca & Niveis",
      href: "/dashboard/seguranca",
      icon: ShieldAlert,
      allowedRoles: ["ADMIN"],
      minLevel: 1,
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {/* Logo Section */}
          <Logo open={open} />

          {/* Navigation Links */}
          <div className="mt-8 flex flex-col gap-1.5">
            {navItems
              .filter((item) => {
                const requiredLevel = menuPermissions[item.href] ?? item.minLevel;
                return userLevel <= requiredLevel;
              })
              .map((item, idx) => {
                const isActive = pathname === item.href;
                const link = {
                  label: item.name,
                  href: item.href,
                  icon: (
                    <item.icon
                      className={`w-5 h-5 shrink-0 ${isActive ? "text-brand-secundar" : "text-brand-terciar/60"}`}
                    />
                  ),
                };
                return (
                  <SidebarLink
                    key={idx}
                    link={link}
                    className={`${
                      isActive
                        ? "bg-brand-principal text-brand-secundar font-bold"
                        : "text-brand-terciar/75 hover:text-brand-secundar hover:bg-brand-principal/40"
                    } ${open && isActive ? "border-l-2 border-brand-secundar" : ""}`}
                  />
                );
              })}
          </div>
        </div>

        {/* User Card & Logout Section */}
        <div className="flex flex-col gap-4">
          <UserCard
            user={user}
            open={open}
            userRole={userRole}
            userLevel={userLevel}
          />

          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/";
            }}
            className={`flex items-center text-sm text-red-650 hover:text-red-700 hover:bg-red-50/50 transition-all cursor-pointer group font-medium overflow-hidden rounded-xl transform-gpu ${
              open
                ? "w-full px-3 py-2.5 justify-start gap-3"
                : "w-10 h-10 justify-center mx-auto p-0 gap-0"
            }`}
          >
            <LogOut className="w-4 h-4 text-red-650 shrink-0 transition-transform group-hover:-translate-x-1" />
            <motion.span
              initial={{ maxWidth: "0px" }}
              animate={{
                maxWidth: open ? "150px" : "0px",
                opacity: open ? 1 : 0,
              }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
              className="whitespace-nowrap inline-block font-bold text-red-650 overflow-hidden will-change-[max-width,opacity] transform-gpu"
            >
              Sair do Portal
            </motion.span>
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

// Logo Component
const Logo = ({ open }: { open: boolean }) => {
  return (
    <Link
      href="/dashboard"
      className={`flex items-center py-1 transition-all duration-200 ${open ? "px-2 justify-start gap-2.5" : "justify-center gap-0"}`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-extra2 to-brand-terciar shadow-sm shrink-0">
        <Shield className="w-4.5 h-4.5 text-brand-principal" />
      </div>
      <motion.div
        initial={{ maxWidth: "0px" }}
        animate={{
          maxWidth: open ? "180px" : "0px",
          opacity: open ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className="min-w-0 overflow-hidden whitespace-nowrap will-change-[max-width,opacity] transform-gpu"
      >
        <span className="font-bold tracking-tight text-brand-extra1 block text-sm">
          Central Azul
        </span>
        <span className="text-[9px] text-brand-terciar/60 uppercase tracking-widest block font-mono">
          Incorporacoes
        </span>
      </motion.div>
    </Link>
  );
};

// User Profile Summary Component
const UserCard = ({
  user,
  open,
  userRole,
  userLevel,
}: {
  user: SessionUser | undefined;
  open: boolean;
  userRole: string;
  userLevel: number;
}) => {
  return (
    <div
      className={`rounded-xl transition-all duration-200 flex flex-col justify-center transform-gpu ${
        open
          ? "p-2.5 bg-brand-principal/20 border border-brand-terciar/10 w-full overflow-hidden"
          : "p-0 bg-transparent border border-transparent w-8 h-8 mx-auto items-center"
      }`}
    >
      <div
        className={`flex items-center justify-start ${open ? "w-full gap-3" : "w-auto gap-0 justify-center"}`}
      >
        {user?.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-8 h-8 rounded-full object-cover border border-brand-terciar/10 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-principal flex items-center justify-center border border-brand-terciar/10 shrink-0">
            <User className="w-4 h-4 text-brand-terciar/60" />
          </div>
        )}
        <motion.div
          initial={{ maxWidth: "0px" }}
          animate={{
            maxWidth: open ? "180px" : "0px",
            opacity: open ? 1 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          className="min-w-0 flex-1 overflow-hidden whitespace-nowrap will-change-[max-width,opacity] transform-gpu"
        >
          <p className="text-xs font-semibold text-brand-extra1 truncate">
            {user?.name || "Colaborador"}
          </p>
          <p className="text-[9px] text-brand-terciar/65 truncate">
            {user?.email}
          </p>
        </motion.div>
      </div>

      <motion.div
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
          marginTop: open ? 10 : 0,
          paddingTop: open ? 8 : 0,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className="border-t border-brand-terciar/10 items-center justify-between overflow-hidden flex w-full will-change-[height,opacity,margin,padding] transform-gpu"
      >
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-principal text-brand-terciar/80 font-mono font-bold whitespace-nowrap">
          {userRole}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-terciar/10 text-brand-terciar font-mono font-bold whitespace-nowrap">
          Nivel {userLevel}
        </span>
      </motion.div>
    </div>
  );
};
