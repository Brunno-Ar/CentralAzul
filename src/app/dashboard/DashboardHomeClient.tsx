"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  Building2, Wine, GraduationCap, ShieldCheck,
  FileText, Activity, Users, ChevronRight, TrendingUp
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import {
  getCompanyStyle,
  type DashboardCompany,
} from "@/lib/company-styles";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";

/* ============================================================
   TYPES
   ============================================================ */
interface DashboardStats {
  totalSistemas: number;
  totalLogs: number;
  totalDocs: number;
  activeUsers: number;
}

interface AuditLog {
  id: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

interface DashboardHomeClientProps {
  userName?: string | null;
  userRole: string;
  userLevel: number;
  stats: DashboardStats;
  recentLogs: AuditLog[];
  companies: DashboardCompany[];
}

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function DashboardHomeClient({
  userName,
  userRole,
  userLevel,
  stats,
  recentLogs,
  companies,
}: DashboardHomeClientProps) {
  return (
    <PageWrapper title="Dashboard">
      <div className="space-y-6">
        {/* === HEADER: Welcome + Security Badge === */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-brand-terciar/10">
          <div>
            <h1 className="text-lg font-bold text-brand-extra1 tracking-tight">
              Ola, {userName || "Colaborador"}
            </h1>
            <p className="text-xs text-brand-terciar/60 mt-0.5">
              Bem-vindo a central integrada do Grupo Azul
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <Badge variant="success">
              <ShieldCheck className="w-3 h-3" />
              Conexao Segura
            </Badge>
            <span className="text-[11px] text-brand-terciar/50 font-mono">
              N{userLevel} · {userRole}
            </span>
          </div>
        </div>

        {/* === STATS GRID === */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <StatCard
            title="Ferramentas"
            value={stats.totalSistemas}
            subtitle="Ativas no sistema"
            icon={<Building2 className="w-5 h-5 text-sky-600" />}
            colorClass="bg-sky-50"
            motionVariants={itemVariants}
          />
          <StatCard
            title="Documentos"
            value={stats.totalDocs}
            subtitle="Armazenados com seguran"
            icon={<FileText className="w-5 h-5 text-amber-600" />}
            colorClass="bg-amber-50"
            motionVariants={itemVariants}
          />
          <StatCard
            title="Logs"
            value={stats.totalLogs}
            subtitle="Registros de auditoria"
            icon={<Activity className="w-5 h-5 text-brand-primary" />}
            colorClass="bg-brand-primary/10"
            motionVariants={itemVariants}
          />
          <StatCard
            title="Usuarios"
            value={stats.activeUsers}
            subtitle="Contas configuradas"
            icon={<Users className="w-5 h-5 text-emerald-600" />}
            colorClass="bg-emerald-50"
            motionVariants={itemVariants}
          />
        </motion.div>

        {/* === COMPANIES SECTION === */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-brand-foreground tracking-tight">
                Divisoes do Grupo
              </h2>
              <p className="text-xs text-brand-terciar/50 mt-0.5">
                Acesse as ferramentas e recursos de cada unidade
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {companies.map((company, idx) => {
              const style = getCompanyStyle(company);
              const Icon = style.icon;
              return (
                <Link href={style.url} key={company.name} className="block">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * idx, type: "spring" as const }}
                    className={`flex flex-col justify-between p-5 rounded-xl border bg-gradient-to-br ${style.color} shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer h-full`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-brand-foreground">{company.name}</span>
                        <div className={`p-2 rounded-lg bg-white/80 shadow-sm ${style.accent}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xs text-brand-terciar/70 leading-relaxed">{style.desc}</p>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-medium text-brand-primary group">
                      <span>Acessar</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* === ACTIVITY + ANNOUNCEMENTS === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Logs */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-brand-terciar/10 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-brand-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-primary" />
                  Auditoria de Seguranca
                </h2>
                <p className="text-xs text-brand-terciar/50 mt-0.5">Eventos recentes do sistema</p>
              </div>
              <Link
                href="/dashboard/seguranca"
                className="text-xs font-medium text-brand-primary hover:text-brand-primary-light flex items-center gap-1"
              >
                Ver Tudo
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-brand-terciar/30 mx-auto mb-2" />
                  <p className="text-xs text-brand-terciar/50">Nenhum evento registrado ainda.</p>
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-brand-principal/30 text-xs gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-extra1 truncate">{log.userName}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-brand-terciar/10 text-brand-terciar font-bold uppercase">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-brand-terciar/70 mt-1 leading-relaxed">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-brand-terciar/40 whitespace-nowrap self-center font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="p-5 rounded-xl border border-brand-terciar/10 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-extra2" />
              <h2 className="text-sm font-semibold text-brand-foreground">Avisos da Central</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-brand-principal/30 border border-brand-terciar/5 space-y-1.5">
                <span className="text-[10px] font-mono text-brand-extra2 font-bold uppercase tracking-wider">Novo</span>
                <p className="text-xs font-semibold text-brand-extra1">Integracao de Seguranca</p>
                <p className="text-[11px] text-brand-terciar/60 leading-relaxed">
                  Credenciais de ferramentas integradas com token ativo do Outlook profissional.
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-brand-principal/20 border border-brand-terciar/5 space-y-1.5">
                <span className="text-[10px] font-mono text-brand-terciar/50 font-bold uppercase tracking-wider">Manutencao</span>
                <p className="text-xs font-semibold text-brand-extra1">Hostinger MySQL</p>
                <p className="text-[11px] text-brand-terciar/60 leading-relaxed">
                  Manutencao programada domingo 02:00 as NordVPN 04:00.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
