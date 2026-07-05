"use client";

import { motion } from "framer-motion";
import { Building2, FileText, Activity, Users } from "lucide-react";

interface Stats {
  totalSistemas: number;
  totalDocs: number;
  totalLogs: number;
  activeUsers: number;
}

export function DashboardStatsGrid({ stats }: { stats: Stats }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
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
  );
}
