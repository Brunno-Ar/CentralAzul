"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Wine, 
  GraduationCap, 
  ShieldCheck, 
  FileText, 
  Activity, 
  Users, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { PageWrapper } from "@/components/PageWrapper";

interface DashboardStats {
  totalSistemas: number;
  totalLogs: number;
  totalDocs: number;
  activeUsers: number;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}


interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  hierarchyLevel?: number;
  company?: string;
  status?: string;
}

interface DashboardCompany {
  id?: string;
  name: string;
  slug?: string;
  color?: string;
  desc?: string;
  iconName?: string;
  colorClass?: string;
  accentClass?: string;
  url?: string;
  isActive?: boolean;
  showOnHome?: boolean;
  order?: number;
}

const fallbackCompanies: DashboardCompany[] = [
  {
    name: "Borgo del Vino",
    desc: "Hospedagem, hotel e vinícola de alto padrão que traz um pedaço da cultura italiana para o Brasil.",
    iconName: "Wine",
    colorClass: "from-brand-terciar/5 to-brand-terciar/15 border-brand-terciar/20",
    accentClass: "text-brand-terciar",
    url: "/dashboard/ferramentas?company=BORGO",
  },
  {
    name: "Grand Reserva",
    desc: "Lançamento de lotes exclusivos de alto padrão inserido no complexo Borgo del Vino.",
    iconName: "Wine",
    colorClass: "from-brand-extra3/5 to-brand-extra3/15 border-brand-extra3/20",
    accentClass: "text-brand-extra3",
    url: "/dashboard/ferramentas?company=BORGO",
  },
  {
    name: "Maple Bear",
    desc: "Rede de ensino bilíngue com metodologia canadense focada no desenvolvimento crítico.",
    iconName: "GraduationCap",
    colorClass: "from-brand-secundar/5 to-brand-secundar/15 border-brand-secundar/20",
    accentClass: "text-brand-secundar",
    url: "/dashboard/ferramentas?company=MAPLE_BEAR",
  },
  {
    name: "Azul Incorporações",
    desc: "Incorporadora de alto padrão com portfólio de condomínios de luxo e prontos para morar.",
    iconName: "Building2",
    colorClass: "from-brand-extra2/5 to-brand-extra2/15 border-brand-extra2/20",
    accentClass: "text-brand-extra2",
    url: "/dashboard/ferramentas?company=AZUL",
  },
];

export default function DashboardHome() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalSistemas: 5,
    totalLogs: 3,
    totalDocs: 3,
    activeUsers: 4,
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<DashboardCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const user = session?.user as SessionUser | undefined;
  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [logsRes, usersRes, panelsRes, docsRes, companiesRes] = await Promise.all([
          fetch("/api/audit"),
          fetch("/api/users"),
          fetch("/api/panels"),
          fetch("/api/documents"),
          fetch("/api/companies"),
        ]);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setRecentLogs(logsData.slice(0, 4));
          setStats(prev => ({
            ...prev,
            totalLogs: logsData.length,
          }));
        }
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setStats(prev => ({
            ...prev,
            activeUsers: usersData.length,
          }));
        }
        if (panelsRes.ok) {
          const panelsData = await panelsRes.json();
          setStats(prev => ({
            ...prev,
            totalSistemas: panelsData.length,
          }));
        }
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setStats(prev => ({
            ...prev,
            totalDocs: docsData.length,
          }));
        }
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          if (Array.isArray(companiesData) && companiesData.length > 0) {
            const activeComps = (companiesData as DashboardCompany[])
              .filter((c) => c.isActive && c.showOnHome)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            setCompanies(activeComps);
          } else {
            setCompanies(fallbackCompanies);
          }
        } else {
          setCompanies(fallbackCompanies);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getCompanyStyle = (c: DashboardCompany) => {
    if (c.colorClass) {
      return {
        icon: c.iconName === "Wine" ? Wine : c.iconName === "GraduationCap" ? GraduationCap : Building2,
        color: c.colorClass,
        accent: c.accentClass || "text-brand-secundar",
        url: c.url || "/dashboard/ferramentas",
        desc: c.desc || "",
      };
    }

    const type = (c.color || "AZUL").toUpperCase();
    const url = `/dashboard/ferramentas?company=${c.slug}`;
    const desc = `Painel corporativo e ferramentas integradas da divisão ${c.name}.`;

    switch (type) {
      case "BORGO":
        return {
          icon: Wine,
          color: "from-brand-terciar/5 to-brand-terciar/15 border-brand-terciar/20",
          accent: "text-brand-terciar",
          url,
          desc,
        };
      case "MAPLE_BEAR":
        return {
          icon: GraduationCap,
          color: "from-brand-secundar/5 to-brand-secundar/15 border-brand-secundar/20",
          accent: "text-brand-secundar",
          url,
          desc,
        };
      case "AZUL":
        return {
          icon: Building2,
          color: "from-brand-extra2/5 to-brand-extra2/15 border-brand-extra2/20",
          accent: "text-brand-extra2",
          url,
          desc,
        };
      default:
        return {
          icon: Building2,
          color: "from-brand-principal/20 to-brand-principal/40 border-brand-secundar/20",
          accent: "text-brand-secundar",
          url,
          desc,
        };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <PageWrapper title="Dashboard">
      <div className="space-y-8 text-brand-terciar">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-terciar/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
            Ola, {user?.name || "Colaborador"}
          </h1>
          <p className="text-xs text-brand-terciar/70 mt-1 leading-normal">
            Bem-vindo a central integrada do Grupo Azul. Seu nivel atual e Nivel {userLevel} ({userRole}).
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Conexao Segura e Criptografada
        </div>
      </div>

      {/* Grid Stats - Mobile First */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
      >
        <motion.div 
          variants={itemVariants} 
          className="p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm"
        >
          <div className="flex justify-between items-center text-brand-terciar/60">
            <span className="text-[10px] font-mono uppercase tracking-wider">Ferramentas</span>
            <Building2 className="w-3.5 h-3.5 text-brand-extra2" />
          </div>
          <p className="text-xl font-bold text-brand-extra1 mt-1 sm:text-2xl">{stats.totalSistemas}</p>
          <p className="text-[9px] text-brand-terciar/50 mt-1">Ferramentas ativas</p>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm"
        >
          <div className="flex justify-between items-center text-brand-terciar/60">
            <span className="text-[10px] font-mono uppercase tracking-wider">Documentos & Midias</span>
            <FileText className="w-3.5 h-3.5 text-brand-terciar" />
          </div>
          <p className="text-xl font-bold text-brand-extra1 mt-1 sm:text-2xl">{stats.totalDocs}</p>
          <p className="text-[9px] text-brand-terciar/50 mt-1">Armazenados com seguranca</p>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm"
        >
          <div className="flex justify-between items-center text-brand-terciar/60">
            <span className="text-[10px] font-mono uppercase tracking-wider">Logs Auditoria</span>
            <Activity className="w-3.5 h-3.5 text-brand-terciar" />
          </div>
          <p className="text-xl font-bold text-brand-extra1 mt-1 sm:text-2xl">{stats.totalLogs}</p>
          <p className="text-[9px] text-brand-terciar/50 mt-1">Registros na central</p>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm"
        >
          <div className="flex justify-between items-center text-brand-terciar/60">
            <span className="text-[10px] font-mono uppercase tracking-wider">Usuarios</span>
            <Users className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-brand-extra1 mt-1 sm:text-2xl">{stats.activeUsers}</p>
          <p className="text-[9px] text-brand-terciar/50 mt-1">Contas configuradas</p>
        </motion.div>
      </motion.div>

      {/* Main Companies Overview - Mobile First */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono uppercase text-brand-terciar/60 tracking-wider">
          Divisoes do Grupo
        </h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {companies.map((company, idx) => {
            const style = getCompanyStyle(company);
            const Icon = style.icon;
            return (
              <Link href={style.url} key={company.name} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, type: "spring" as const }}
                  className={`flex flex-col justify-between p-5 rounded-2xl border bg-gradient-to-br ${style.color} shadow-sm transition-all hover:shadow-md hover:border-brand-secundar/40 hover:-translate-y-0.5 cursor-pointer h-full`}
                >
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <span className="text-sm font-bold text-brand-extra1">{company.name}</span>
                      <div className={`p-2 rounded-lg bg-white/80 shadow-sm ${style.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xs text-brand-terciar/80 leading-relaxed">
                      {style.desc}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Live Logs Section & Announcements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Real-time Security logs */}
        <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-brand-terciar" />
              Auditoria de Seguranca Recente
            </h2>
            <Link 
              href="/dashboard/seguranca"
              className="text-[10px] text-brand-secundar hover:text-brand-secundar/80 flex items-center gap-1 font-bold"
            >
              Ver Tudo
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-brand-principal/50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <p className="text-xs text-brand-terciar/50 py-4 text-center">Nenhum evento registrado ainda.</p>
            ) : (
              recentLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start justify-between p-3 rounded-xl border border-brand-terciar/10 bg-brand-principal/20 text-xs gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-extra1 truncate">{log.userName}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white border border-brand-terciar/10 text-brand-terciar font-bold uppercase">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-brand-terciar/80 mt-1 leading-normal">{log.details}</p>
                  </div>
                  <span className="text-[9px] font-mono text-brand-terciar/45 whitespace-nowrap self-center">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices/Announcements */}
        <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
          <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-brand-extra2" />
            Avisos da Central
          </h2>
          
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-brand-terciar/10 bg-brand-principal/20 space-y-1">
              <span className="text-[9px] font-mono text-brand-extra2 font-bold">IMPORTANTE</span>
              <p className="text-xs font-bold text-brand-extra1">Nova integracao de Seguranca</p>
              <p className="text-[10px] text-brand-terciar/70 leading-relaxed">
                Todas as credenciais de ferramentas agora estao integradas com o token ativo do Outlook profissional.
              </p>
            </div>
            
            <div className="p-3.5 rounded-xl border border-brand-terciar/10 bg-brand-principal/20 space-y-1">
              <span className="text-[9px] font-mono text-brand-terciar font-bold">AVISO</span>
              <p className="text-xs font-bold text-brand-extra1">Manutencao Hostinger MySQL</p>
              <p className="text-[10px] text-brand-terciar/70 leading-relaxed">
                Manutencao programada do banco de dados na madrugada de domingo das 02:00 as 04:00.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PageWrapper>
  );
}
