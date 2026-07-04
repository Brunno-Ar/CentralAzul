"use client";

import { Activity, ChevronRight } from "lucide-react";
import Link from "next/link";

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

export function DashboardRecentLogs({ logs }: { logs: AuditLog[] }) {
  return (
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
        {logs.length === 0 ? (
          <p className="text-xs text-brand-terciar/50 py-4 text-center">Nenhum evento registrado ainda.</p>
        ) : (
          logs.map((log) => (
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
                {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
