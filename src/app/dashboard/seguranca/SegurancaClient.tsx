"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Users, Lock, RefreshCw, Globe, Terminal,
  CheckCircle, ToggleLeft, ToggleRight, Plus,
  Trash2, Edit2, Save, X, Sliders
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

interface UserItem {
  id: string; name: string; email: string; image: string;
  role: string; hierarchyLevel: number; status: string; createdAt: string;
}

interface AuditLog {
  id: string; userId: string; userName: string; action: string;
  details: string; ipAddress: string; userAgent: string; createdAt: string;
}

interface RoleConfig {
  id: string; name: string; displayName: string; hierarchyLevel: number;
  createdAt: string; updatedAt: string;
}

interface MenuPermissionItem {
  href: string; name: string; minLevel: number;
  icon?: string | null;
  order?: number;
  isActive?: boolean;
}

interface LevelItem {
  id: string;
  level: number;
  name: string;
  createdAt: string;
}

interface SegurancaClientProps {
  initialUsers: UserItem[];
  initialLogs: AuditLog[];
  initialRoles: RoleConfig[];
  initialMenuPermissions: MenuPermissionItem[];
  initialLevels: LevelItem[];
  initialConfig: { restrictDomain: boolean; mfaRequired: boolean; sessionTimeout: boolean; };
  userLevel: number;
  userRole: string;
  currentUserId: string;
}
export default function SegurancaClient({
  initialUsers, initialLogs, initialRoles, initialMenuPermissions, initialLevels,
  initialConfig, userLevel, userRole, currentUserId,
}: SegurancaClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingMenuPerms, setLoadingMenuPerms] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplay, setNewRoleDisplay] = useState("");
  const [newRoleLevel, setNewRoleLevel] = useState(3);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDisplay, setEditRoleDisplay] = useState("");
  const [editRoleLevel, setEditRoleLevel] = useState(3);
  const [roleMessage, setRoleMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("VIEWER");
  const [userMessage, setUserMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [menuPermissions, setMenuPermissions] = useState<MenuPermissionItem[]>(initialMenuPermissions);
  const [updatingMenuHref, setUpdatingMenuHref] = useState<string | null>(null);
  const [menuPermMessage, setMenuPermMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCreatingMenuPerm, setIsCreatingMenuPerm] = useState(false);
  const [newMenuPermHref, setNewMenuPermHref] = useState("");
  const [newMenuPermName, setNewMenuPermName] = useState("");
  const [newMenuPermMinLevel, setNewMenuPermMinLevel] = useState(3);
  const [newMenuPermIcon, setNewMenuPermIcon] = useState("");
  const [newMenuPermOrder, setNewMenuPermOrder] = useState(0);
  const [newMenuPermIsActive, setNewMenuPermIsActive] = useState(true);
  const [deletingMenuPermHref, setDeletingMenuPermHref] = useState<string | null>(null);

  const [levels, setLevels] = useState<LevelItem[]>(initialLevels);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [isCreatingLevel, setIsCreatingLevel] = useState(false);
  const [newLevelNumber, setNewLevelNumber] = useState(4);
  const [newLevelName, setNewLevelName] = useState("");
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [editLevelName, setEditLevelName] = useState("");
  const [levelMessage, setLevelMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [restrictDomain, setRestrictDomain] = useState(initialConfig.restrictDomain);
  const [mfaRequired, setMfaRequired] = useState(initialConfig.mfaRequired);
  const [sessionTimeout, setSessionTimeout] = useState(initialConfig.sessionTimeout);

  const isUserAdmin = userRole === "ADMIN" || userLevel === 1;

  const loadUsers = useCallback(async () => {
    if (!isUserAdmin) return;
    try {
      const res = await fetch("/api/users");
      if (res.ok) { const data = await res.json(); setUsers(data); }
    } catch (e) { console.error(e); }
    finally { setLoadingUsers(false); }
  }, [isUserAdmin]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) { const data = await res.json(); setRoles(data); }
    } catch (e) { console.error(e); }
    finally { setLoadingRoles(false); }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) { const data = await res.json(); setLogs(data); }
    } catch (e) { console.error(e); }
    finally { setLoadingLogs(false); }
  }, []);

  const loadMenuPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/menu-permissions");
      if (res.ok) { const data = await res.json(); setMenuPermissions(data); }
    } catch (e) { console.error(e); }
    finally { setLoadingMenuPerms(false); }
  }, []);

  const loadLevels = useCallback(async () => {
    try {
      const res = await fetch("/api/levels");
      if (res.ok) { const data = await res.json(); setLevels(data); }
    } catch (e) { console.error(e); }
    finally { setLoadingLevels(false); }
  }, []);

  const handleCreateMenuPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuPermHref || !newMenuPermName) { setMenuPermMessage({ type: "error", text: "Caminho e nome sao obrigatorios" }); return; }
    try {
      const res = await fetch("/api/menu-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          href: newMenuPermHref,
          name: newMenuPermName,
          minLevel: newMenuPermMinLevel,
          icon: newMenuPermIcon || null,
          order: newMenuPermOrder,
          isActive: newMenuPermIsActive,
        }),
      });
      if (res.ok) {
        setMenuPermMessage({ type: "success", text: "Permissao criada com sucesso" });
        setNewMenuPermHref(""); setNewMenuPermName(""); setNewMenuPermMinLevel(3);
        setNewMenuPermIcon(""); setNewMenuPermOrder(0); setNewMenuPermIsActive(true);
        setIsCreatingMenuPerm(false);
        await Promise.all([loadMenuPermissions(), loadLogs()]);
      } else { const errData = await res.json(); setMenuPermMessage({ type: "error", text: errData.error || "Erro ao criar permissao" }); }
    } catch { setMenuPermMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
  };

  const handleDeleteMenuPermission = async (href: string, name: string) => {
    if (!confirm("Tem certeza que deseja remover a permissao do menu '" + name + "'?")) return;
    setDeletingMenuPermHref(href);
    try {
      const res = await fetch("/api/menu-permissions?href=" + encodeURIComponent(href), { method: "DELETE" });
      if (res.ok) {
        setMenuPermMessage({ type: "success", text: "Permissao removida com sucesso" });
        await Promise.all([loadMenuPermissions(), loadLogs()]);
      } else { const errData = await res.json(); setMenuPermMessage({ type: "error", text: errData.error || "Erro ao remover permissao" }); }
    } catch { setMenuPermMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
    finally { setDeletingMenuPermHref(null); }
  };

  const handleCreateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevelName || newLevelNumber < 1) { setLevelMessage({ type: "error", text: "Numero e nome do nivel sao obrigatorios" }); return; }
    try {
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: newLevelNumber, name: newLevelName }),
      });
      if (res.ok) {
        setLevelMessage({ type: "success", text: "Nivel criado com sucesso" });
        setNewLevelNumber(4); setNewLevelName(""); setIsCreatingLevel(false);
        await Promise.all([loadLevels(), loadLogs()]);
      } else { const errData = await res.json(); setLevelMessage({ type: "error", text: errData.error || "Erro ao criar nivel" }); }
    } catch { setLevelMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
  };

  const handleUpdateLevel = async (id: string, name: string) => {
    setLevelMessage(null);
    try {
      const res = await fetch("/api/levels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (res.ok) {
        setLevelMessage({ type: "success", text: "Nivel atualizado com sucesso" });
        setEditingLevelId(null);
        await Promise.all([loadLevels(), loadLogs()]);
      } else { const errData = await res.json(); setLevelMessage({ type: "error", text: errData.error || "Erro ao atualizar nivel" }); }
    } catch { setLevelMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
  };

  const handleDeleteLevel = async (id: string, name: string) => {
    if (!confirm("Tem certeza que deseja remover o nivel '" + name + "'?")) return;
    try {
      const res = await fetch("/api/levels?id=" + id, { method: "DELETE" });
      if (res.ok) {
        setLevelMessage({ type: "success", text: "Nivel removido com sucesso" });
        await Promise.all([loadLevels(), loadLogs()]);
      } else { const errData = await res.json(); setLevelMessage({ type: "error", text: errData.error || "Erro ao remover nivel" }); }
    } catch { setLevelMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
  };
  const saveConfig = async (key: string, value: boolean) => {
    try {
      await fetch("/api/config", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value ? "true" : "false" }),
      });
    } catch (e) { console.error("Erro ao salvar config", e); }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserItem>) => {
    setUpdatingUserId(userId);
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const body = { userId, role: updates.role ?? targetUser.role, hierarchyLevel: updates.hierarchyLevel ?? targetUser.hierarchyLevel, status: updates.status ?? targetUser.status };
    try {
      const res = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { await Promise.all([loadUsers(), loadLogs()]); }
    } catch (e) { console.error(e); }
    finally { setUpdatingUserId(null); }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName || !newRoleDisplay) { setRoleMessage({ type: "error", text: "Preencha o identificador e o nome de exibicao" }); return; }
    const cleanName = newRoleName.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    try {
      const res = await fetch("/api/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: cleanName, displayName: newRoleDisplay, hierarchyLevel: newRoleLevel }) });
      if (res.ok) {
        setRoleMessage({ type: "success", text: "Cargo criado com sucesso" });
        setNewRoleName(""); setNewRoleDisplay(""); setNewRoleLevel(3); setIsCreatingRole(false);
        await Promise.all([loadRoles(), loadUsers(), loadLogs()]);
      } else { const errData = await res.json(); setRoleMessage({ type: "error", text: errData.error || "Erro ao criar cargo" }); }
    } catch { setRoleMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword || !newUserRole) { setUserMessage({ type: "error", text: "Preencha todos os campos obrigatorios" }); return; }
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole }) });
      if (res.ok) {
        setUserMessage({ type: "success", text: "Colaborador cadastrado com sucesso" });
        setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("VIEWER"); setIsCreatingUser(false);
        await Promise.all([loadUsers(), loadLogs()]);
      } else { const errData = await res.json(); setUserMessage({ type: "error", text: errData.error || "Erro ao criar colaborador" }); }
    } catch { setUserMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
  };

  const handleUpdateMenuPermission = async (href: string, updates: Partial<MenuPermissionItem> | number) => {
    setUpdatingMenuHref(href); setMenuPermMessage(null);
    const body = typeof updates === "number" ? { href, minLevel: updates } : { href, ...updates };
    try {
      const res = await fetch("/api/menu-permissions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setMenuPermMessage({ type: "success", text: "Permissoes do menu salvas com sucesso" }); await Promise.all([loadMenuPermissions(), loadLogs()]); }
      else { const errData = await res.json(); setMenuPermMessage({ type: "error", text: errData.error || "Erro ao atualizar permissao" }); }
    } catch { setMenuPermMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
    finally { setUpdatingMenuHref(null); }
  };

  const handleStartEditRole = (role: RoleConfig) => {
    setEditingRoleId(role.id); setEditRoleName(role.name); setEditRoleDisplay(role.displayName); setEditRoleLevel(role.hierarchyLevel);
  };

  const handleUpdateRoleSubmit = async (id: string) => {
    if (!editRoleName || !editRoleDisplay) { setRoleMessage({ type: "error", text: "Identificador e nome de exibicao sao obrigatorios" }); return; }
    const cleanName = editRoleName.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    try {
      const res = await fetch("/api/roles", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: cleanName, displayName: editRoleDisplay, hierarchyLevel: editRoleLevel }) });
      if (res.ok) { setRoleMessage({ type: "success", text: "Cargo atualizado com sucesso" }); setEditingRoleId(null); await Promise.all([loadRoles(), loadUsers(), loadLogs()]); }
      else { const errData = await res.json(); setRoleMessage({ type: "error", text: errData.error || "Erro ao atualizar cargo" }); }
    } catch { setRoleMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (name === "ADMIN" || name === "VIEWER") { setRoleMessage({ type: "error", text: "Os cargos padrao ADMIN e VIEWER nao podem ser excluidos" }); return; }
    if (!confirm("Tem certeza que deseja apagar o cargo '" + name + "'? Todos os usuarios deste cargo serao redefinidos para VIEWER.")) { return; }
    try {
      const res = await fetch("/api/roles?id=" + id, { method: "DELETE" });
      if (res.ok) { setRoleMessage({ type: "success", text: "Cargo removido com sucesso" }); await Promise.all([loadRoles(), loadUsers(), loadLogs()]); }
      else { const errData = await res.json(); setRoleMessage({ type: "error", text: errData.error || "Erro ao remover cargo" }); }
    } catch { setRoleMessage({ type: "error", text: "Erro na conexao com o servidor" }); }
  };

  const filteredLogs = logs.filter((log) => actionFilter === "ALL" || log.action === actionFilter);

  const getLogActionColor = (action: string) => {
    switch (action) {
      case "LOGIN": return "text-emerald-800 border-emerald-200 bg-emerald-50";
      case "ALTERAR_HIERARQUIA": return "text-red-800 border-red-200 bg-red-50";
      case "UPLOAD_DOCUMENT": return "text-brand-extra2 border-blue-200 bg-blue-50";
      case "CONFIGURAR_CARGO": return "text-amber-800 border-amber-200 bg-amber-50";
      default: return "text-brand-secundar border-brand-secundar/10 bg-brand-principal";
    }
  };

  const uniqueLevels = Array.from(new Set(roles.map((r) => r.hierarchyLevel))).sort((a, b) => a - b);

  const getLevelLabel = (lvl: number) => {
    if (lvl === 1) return "Direcao Geral";
    if (lvl === 2) return "Coordenacao / Gerencia";
    if (lvl === 3) return "Operacional";
    const roleForLevel = roles.find((r) => r.hierarchyLevel === lvl);
    return roleForLevel ? roleForLevel.displayName : "Nivel " + lvl;
  };
  if (!isUserAdmin) {
    return (
      <PageWrapper title="Seguranca & Niveis de Acesso">
        <div className="flex flex-col items-center justify-center py-16 text-center border border-brand-secundar/15 rounded-2xl bg-white p-6 shadow-sm">
          <Lock className="w-10 h-10 text-brand-secundar/40 mb-4" />
          <h2 className="text-base font-bold text-brand-extra1">Acesso Restrito</h2>
          <p className="text-xs text-brand-secundar/70 mt-2 max-w-sm leading-relaxed">
            Esta secao contem configuracoes globais de seguranca e logs de auditoria confidenciais. Apenas administradores (Nivel 1) possuem autorizacao para visualizar.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Seguranca & Niveis de Acesso">
      <div className="space-y-8 text-brand-terciar">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">Seguranca & Niveis de Acesso</h1>
          <p className="text-xs text-brand-terciar/70 mt-1">Gerencie permissoes de usuarios corporativos, configure cargos customizados e monitore logs de auditoria em tempo real.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4 lg:col-span-1">
            <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-brand-extra2" /> Politicas Globais
            </h2>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-brand-extra1">Restringir Dominio Outlook</p>
                  <p className="text-[10px] text-brand-terciar/70 mt-0.5 leading-relaxed">Permite login profissional apenas para contas @grupoazul.com.br.</p>
                </div>
                <button role="switch" aria-checked={restrictDomain} aria-label="Restringir Dominio Outlook"
                  onClick={() => { const newVal = !restrictDomain; setRestrictDomain(newVal); saveConfig("restrictDomain", newVal); }}
                  className="text-brand-terciar/50 hover:text-brand-extra1 cursor-pointer">
                  {restrictDomain ? <ToggleRight className="w-9 h-9 text-emerald-600" /> : <ToggleLeft className="w-9 h-9 text-brand-terciar/30" />}
                </button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-brand-extra1">Exigir MFA Corporativo</p>
                  <p className="text-[10px] text-brand-terciar/70 mt-0.5 leading-relaxed">Verifica se o usuario completou a autenticacao multifator no Entra ID.</p>
                </div>
                <button role="switch" aria-checked={mfaRequired} aria-label="Exigir MFA Corporativo"
                  onClick={() => { const newVal = !mfaRequired; setMfaRequired(newVal); saveConfig("mfaRequired", newVal); }}
                  className="text-brand-terciar/50 hover:text-brand-extra1 cursor-pointer">
                  {mfaRequired ? <ToggleRight className="w-9 h-9 text-emerald-600" /> : <ToggleLeft className="w-9 h-9 text-brand-terciar/30" />}
                </button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-brand-extra1">Expiracao Rapida de Sessao</p>
                  <p className="text-[10px] text-brand-terciar/70 mt-0.5 leading-relaxed">Desconecta o usuario apos 15 minutos de inatividade.</p>
                </div>
                <button role="switch" aria-checked={sessionTimeout} aria-label="Expiracao Rapida de Sessao"
                  onClick={() => { const newVal = !sessionTimeout; setSessionTimeout(newVal); saveConfig("sessionTimeout", newVal); }}
                  className="text-brand-terciar/50 hover:text-brand-extra1 cursor-pointer">
                  {sessionTimeout ? <ToggleRight className="w-9 h-9 text-emerald-600" /> : <ToggleLeft className="w-9 h-9 text-brand-terciar/30" />}
                </button>
              </div>
            </div>
            <div className="pt-4 border-t border-brand-terciar/10 text-[10px] text-brand-terciar/50 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-650" />
              <span>Politicas salvas e aplicadas em tempo real</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-brand-terciar" /> Controle de Hierarquia & Contas
              </h2>
              <button onClick={() => { setUserMessage(null); setIsCreatingUser(!isCreatingUser); }}
                aria-expanded={isCreatingUser} aria-controls="new-user-form"
                aria-label={isCreatingUser ? "Fechar formulario de colaborador" : "Abrir formulario de novo colaborador"}
                className="flex items-center justify-center gap-1.5 self-start sm:self-center px-3 py-1.5 bg-brand-secundar text-white font-bold rounded-lg text-xs hover:bg-brand-secundar/90 transition-colors cursor-pointer transform-gpu">
                {isCreatingUser ? <><X className="w-3.5 h-3.5" /> Fechar</> : <><Plus className="w-3.5 h-3.5" /> Novo Colaborador</>}
              </button>
            </div>
            {userMessage && (
              <div className={"p-3 rounded-lg text-xs border " + (userMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" : "border-red-200 bg-red-50 text-red-800")}>{userMessage.text}</div>
            )}
            <AnimatePresence>
              {isCreatingUser && (
                <motion.form id="new-user-form" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "linear" }} onSubmit={handleCreateUser} className="overflow-hidden space-y-3 bg-brand-principal/20 p-4 rounded-xl border border-brand-terciar/10 transform-gpu">
                  <h3 className="text-xs font-bold text-brand-extra1 uppercase tracking-wider">Novo Colaborador</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome Completo</label><input type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Ex: Joao da Silva" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">E-mail</label><input type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Ex: joao@grupoazul.com.br" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Senha de Acesso</label><input type="password" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Senha forte" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Cargo</label><select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar cursor-pointer">{roles.map((r) => <option key={r.id} value={r.name}>{r.displayName} (Nivel {r.hierarchyLevel})</option>)}</select></div>
                  </div>
                  <div className="flex justify-end pt-2"><button type="submit" className="px-4 py-1.5 bg-brand-secundar text-white font-bold rounded-lg text-xs hover:bg-brand-secundar/90 transition-colors cursor-pointer">Salvar Colaborador</button></div>
                </motion.form>
              )}
            </AnimatePresence>
            <div className="overflow-x-auto">
              {loadingUsers || loadingRoles ? (
                <div className="space-y-2 py-4"><div className="h-8 bg-brand-principal animate-pulse rounded-lg" /><div className="h-8 bg-brand-principal animate-pulse rounded-lg" /></div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead><tr className="border-b border-brand-terciar/10 text-brand-terciar/60 font-mono text-[9px] uppercase tracking-wider"><th className="py-2.5 px-2">Usuario</th><th className="py-2.5 px-2">Cargo / Nivel</th><th className="py-2.5 px-2">Status</th><th className="py-2.5 px-2 text-right">Acoes</th></tr></thead>
                  <tbody className="divide-y divide-brand-terciar/10">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-brand-principal/20">
                        <td className="py-3 px-2"><div className="flex items-center gap-2.5"><img src={u.image} alt={u.name} className="w-6 h-6 rounded-full object-cover border border-brand-terciar/10" /><div className="min-w-0"><p className="font-bold text-brand-extra1 truncate max-w-[120px] sm:max-w-none">{u.name}</p><p className="text-[10px] text-brand-terciar/60 truncate max-w-[120px] sm:max-w-none">{u.email}</p></div></div></td>
                        <td className="py-3 px-2"><div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5"><select value={u.role} disabled={updatingUserId === u.id || u.id === currentUserId} onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })} aria-label={"Cargo do usuario " + u.name} className="bg-brand-principal/40 border border-brand-terciar/15 text-[10px] rounded px-1.5 py-0.5 text-brand-terciar focus:outline-none cursor-pointer focus:bg-white">{roles.map((r) => <option key={r.id} value={r.name}>{r.displayName}</option>)}</select><span className="text-[10px] text-brand-terciar/50 font-mono">(Lvl {u.hierarchyLevel})</span></div></td>
                        <td className="py-3 px-2"><select value={u.status} disabled={updatingUserId === u.id || u.id === currentUserId} onChange={(e) => handleUpdateUser(u.id, { status: e.target.value })} aria-label={"Status do usuario " + u.name} className={"bg-brand-principal/40 border border-brand-terciar/15 text-[10px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer focus:bg-white " + (u.status === "ACTIVE" ? "text-emerald-700 font-bold" : "text-red-700 font-bold")}><option value="ACTIVE">ATIVO</option><option value="BLOCKED">BLOQ</option></select></td>
                        <td className="py-3 px-2 text-right">{updatingUserId === u.id ? <span className="w-3 h-3 border border-brand-secundar border-t-transparent rounded-full animate-spin inline-block" /> : <span className="text-[10px] text-brand-terciar/40 font-mono">Ok</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2"><Sliders className="w-3.5 h-3.5 text-brand-terciar" /> Configuracao de Cargos & Niveis de Hierarquia</h2>
            <button onClick={() => { setRoleMessage(null); setIsCreatingRole(!isCreatingRole); }}
              aria-expanded={isCreatingRole} aria-controls="new-role-form"
              aria-label={isCreatingRole ? "Fechar formulario de cargo" : "Abrir formulario de novo cargo"}
              className="flex items-center justify-center gap-1.5 self-start sm:self-center px-3 py-1.5 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 transition-colors cursor-pointer">
              {isCreatingRole ? <><X className="w-3 h-3" /> Fechar</> : <><Plus className="w-3 h-3" /> Novo Cargo</>}
            </button>
          </div>
          {roleMessage && (
            <div className={"p-3 rounded-lg text-xs border " + (roleMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" : "border-red-200 bg-red-50 text-red-800")}>{roleMessage.text}</div>
          )}
          <AnimatePresence>
            {isCreatingRole && (
              <motion.div id="new-role-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <form onSubmit={handleCreateRole} className="p-4 rounded-xl bg-brand-principal/20 border border-brand-terciar/10 space-y-4">
                  <h3 className="text-xs font-bold text-brand-extra1">Adicionar Novo Cargo</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Identificador</label><input type="text" required value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Ex: COORDENADOR_TI" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome de Exibicao</label><input type="text" required value={newRoleDisplay} onChange={(e) => setNewRoleDisplay(e.target.value)} placeholder="Ex: Coordenador de TI" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nivel de Hierarquia</label><select value={newRoleLevel} onChange={(e) => setNewRoleLevel(parseInt(e.target.value, 10))} className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors cursor-pointer"><option value="1">Nivel 1 (Direcao Geral)</option><option value="2">Nivel 2 (Coordenacao / Gerencia)</option><option value="3">Nivel 3 (Operacional)</option><option value="4">Nivel 4</option><option value="5">Nivel 5</option></select></div>
                  </div>
                  <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsCreatingRole(false)} className="px-3 py-1.5 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:bg-white cursor-pointer">Cancelar</button><button type="submit" className="px-3 py-1.5 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/95 shadow-sm transition-colors cursor-pointer">Salvar Cargo</button></div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="overflow-x-auto border border-brand-terciar/10 rounded-xl">
            {loadingRoles ? (
              <div className="p-4 text-xs text-brand-terciar/50 text-center animate-pulse">Carregando cargos...</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="border-b border-brand-terciar/10 bg-brand-principal/10 text-brand-terciar/60 font-mono text-[9px] uppercase tracking-wider"><th className="py-2.5 px-3">Identificador</th><th className="py-2.5 px-3">Nome de Exibicao</th><th className="py-2.5 px-3">Nivel</th><th className="py-2.5 px-3 text-right">Acoes</th></tr></thead>
                <tbody className="divide-y divide-brand-terciar/10">
                  {roles.map((r) => (
                    <tr key={r.id} className="hover:bg-brand-principal/10">
                      <td className="py-3 px-3 font-mono text-xs text-brand-extra1">{editingRoleId === r.id ? <input type="text" value={editRoleName} onChange={(e) => setEditRoleName(e.target.value)} className="px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none" /> : r.name}</td>
                      <td className="py-3 px-3 text-xs text-brand-terciar">{editingRoleId === r.id ? <input type="text" value={editRoleDisplay} onChange={(e) => setEditRoleDisplay(e.target.value)} className="px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none" /> : r.displayName}</td>
                      <td className="py-3 px-3 text-xs">{editingRoleId === r.id ? <select value={editRoleLevel} onChange={(e) => setEditRoleLevel(parseInt(e.target.value, 10))} className="px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none cursor-pointer"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select> : <span className="font-semibold text-brand-extra1">Nivel {r.hierarchyLevel}</span>}</td>
                      <td className="py-3 px-3 text-right">
                        {editingRoleId === r.id ? (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => handleUpdateRoleSubmit(r.id)} className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer" title="Salvar" aria-label={"Salvar cargo " + r.name}><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingRoleId(null)} className="p-1 text-brand-terciar/70 bg-brand-principal hover:bg-brand-terciar/10 rounded border border-brand-terciar/15 cursor-pointer" title="Cancelar" aria-label={"Cancelar edicao " + r.name}><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => handleStartEditRole(r)} className="p-1 text-brand-secundar bg-brand-principal hover:bg-brand-principal/70 rounded border border-brand-terciar/15 cursor-pointer" title="Editar" aria-label={"Editar " + r.name}><Edit2 className="w-3.5 h-3.5" /></button>
                            {r.name !== "ADMIN" && r.name !== "VIEWER" && <button onClick={() => handleDeleteRole(r.id, r.name)} className="p-1 text-red-650 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer" title="Excluir" aria-label={"Excluir " + r.name}><Trash2 className="w-3.5 h-3.5" /></button>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2"><Sliders className="w-3.5 h-3.5 text-brand-terciar" /> Configuracao de Niveis de Hierarquia</h2>
            <button onClick={() => { setLevelMessage(null); setIsCreatingLevel(!isCreatingLevel); }}
              aria-expanded={isCreatingLevel} aria-controls="new-level-form"
              aria-label={isCreatingLevel ? "Fechar formulario de nivel" : "Abrir formulario de novo nivel"}
              className="flex items-center justify-center gap-1.5 self-start sm:self-center px-3 py-1.5 bg-brand-terciar text-white font-bold rounded-lg text-xs hover:bg-brand-terciar/90 transition-colors cursor-pointer">
              {isCreatingLevel ? <><X className="w-3 h-3" /> Fechar</> : <><Plus className="w-3 h-3" /> Novo Nivel</>}
            </button>
          </div>
          {levelMessage && (
            <div className={"p-3 rounded-lg text-xs border " + (levelMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" : "border-red-200 bg-red-50 text-red-800")}>{levelMessage.text}</div>
          )}
          <AnimatePresence>
            {isCreatingLevel && (
              <motion.div id="new-level-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <form onSubmit={handleCreateLevel} className="p-4 rounded-xl bg-brand-principal/20 border border-brand-terciar/10 space-y-4">
                  <h3 className="text-xs font-bold text-brand-extra1">Adicionar Novo Nivel</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Numero do Nivel</label><input type="number" min="1" required value={newLevelNumber} onChange={(e) => setNewLevelNumber(parseInt(e.target.value, 10))} className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome do Nivel</label><input type="text" required value={newLevelName} onChange={(e) => setNewLevelName(e.target.value)} placeholder="Ex: Consultor Externo" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors" /></div>
                  </div>
                  <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsCreatingLevel(false)} className="px-3 py-1.5 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:bg-white cursor-pointer">Cancelar</button><button type="submit" className="px-3 py-1.5 bg-brand-terciar text-white font-bold rounded-lg text-xs hover:bg-brand-terciar/95 shadow-sm transition-colors cursor-pointer">Salvar Nivel</button></div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="overflow-x-auto border border-brand-terciar/10 rounded-xl">
            {loadingLevels ? (
              <div className="p-4 text-xs text-brand-terciar/50 text-center animate-pulse">Carregando niveis...</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="border-b border-brand-terciar/10 bg-brand-principal/10 text-brand-terciar/60 font-mono text-[9px] uppercase tracking-wider"><th className="py-2.5 px-3">Nivel</th><th className="py-2.5 px-3">Nome</th><th className="py-2.5 px-3 text-right">Acoes</th></tr></thead>
                <tbody className="divide-y divide-brand-terciar/10">
                  {levels.map((l) => (
                    <tr key={l.id} className="hover:bg-brand-principal/10">
                      <td className="py-3 px-3 font-semibold text-brand-extra1">Nivel {l.level}</td>
                      <td className="py-3 px-3 text-xs text-brand-terciar">{editingLevelId === l.id ? <input type="text" value={editLevelName} onChange={(e) => setEditLevelName(e.target.value)} className="px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none" /> : l.name}</td>
                      <td className="py-3 px-3 text-right">
                        {editingLevelId === l.id ? (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => handleUpdateLevel(l.id, editLevelName)} className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer" title="Salvar" aria-label={"Salvar nivel " + l.name}><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingLevelId(null)} className="p-1 text-brand-terciar/70 bg-brand-principal hover:bg-brand-terciar/10 rounded border border-brand-terciar/15 cursor-pointer" title="Cancelar" aria-label={"Cancelar edicao " + l.name}><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => { setEditingLevelId(l.id); setEditLevelName(l.name); }} className="p-1 text-brand-secundar bg-brand-principal hover:bg-brand-principal/70 rounded border border-brand-terciar/15 cursor-pointer" title="Editar" aria-label={"Editar " + l.name}><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteLevel(l.id, l.name)} className="p-1 text-red-650 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer" title="Excluir" aria-label={"Excluir " + l.name}><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-brand-terciar" /> Permissoes de Acesso por Aba do Menu</h2>
            <button onClick={() => { setMenuPermMessage(null); setIsCreatingMenuPerm(!isCreatingMenuPerm); }}
              aria-expanded={isCreatingMenuPerm} aria-controls="new-menu-perm-form"
              aria-label={isCreatingMenuPerm ? "Fechar formulario de permissao" : "Abrir formulario de nova permissao"}
              className="flex items-center justify-center gap-1.5 self-start sm:self-center px-3 py-1.5 bg-brand-secundar text-white font-bold rounded-lg text-xs hover:bg-brand-secundar/90 transition-colors cursor-pointer">
              {isCreatingMenuPerm ? <><X className="w-3 h-3" /> Fechar</> : <><Plus className="w-3 h-3" /> Nova Permissao</>}
            </button>
          </div>
          {menuPermMessage && (<div className={"p-3 rounded-lg text-xs border " + (menuPermMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" : "border-red-200 bg-red-50 text-red-800")}>{menuPermMessage.text}</div>)}
          <AnimatePresence>
            {isCreatingMenuPerm && (
              <motion.div id="new-menu-perm-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <form onSubmit={handleCreateMenuPermission} className="p-4 rounded-xl bg-brand-principal/20 border border-brand-terciar/10 space-y-4">
                  <h3 className="text-xs font-bold text-brand-extra1">Adicionar Nova Permissao de Menu</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Caminho (href)</label><input type="text" required value={newMenuPermHref} onChange={(e) => setNewMenuPermHref(e.target.value)} placeholder="Ex: /dashboard/relatorios" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome</label><input type="text" required value={newMenuPermName} onChange={(e) => setNewMenuPermName(e.target.value)} placeholder="Ex: Relatorios" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nivel Minimo</label><select value={newMenuPermMinLevel} onChange={(e) => setNewMenuPermMinLevel(parseInt(e.target.value, 10))} className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors cursor-pointer">{uniqueLevels.map((lvl) => <option key={lvl} value={lvl}>Nivel {lvl} ({getLevelLabel(lvl)})</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Icone</label><input type="text" value={newMenuPermIcon} onChange={(e) => setNewMenuPermIcon(e.target.value)} placeholder="Ex: Grid" className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Ordem</label><input type="number" value={newMenuPermOrder} onChange={(e) => setNewMenuPermOrder(parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Ativo</label><select value={newMenuPermIsActive ? "true" : "false"} onChange={(e) => setNewMenuPermIsActive(e.target.value === "true")} className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors cursor-pointer"><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
                  </div>
                  <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsCreatingMenuPerm(false)} className="px-3 py-1.5 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:bg-white cursor-pointer">Cancelar</button><button type="submit" className="px-3 py-1.5 bg-brand-secundar text-white font-bold rounded-lg text-xs hover:bg-brand-secundar/95 shadow-sm transition-colors cursor-pointer">Salvar Permissao</button></div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="overflow-x-auto border border-brand-terciar/10 rounded-xl">
            {loadingMenuPerms ? (<div className="p-4 text-xs text-brand-terciar/50 text-center animate-pulse">Carregando permissoes...</div>) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="border-b border-brand-terciar/10 bg-brand-principal/10 text-brand-terciar/60 font-mono text-[9px] uppercase tracking-wider"><th className="py-2.5 px-3">Nome</th><th className="py-2.5 px-3">Caminho</th><th className="py-2.5 px-3">Nivel Minimo</th><th className="py-2.5 px-3">Icone</th><th className="py-2.5 px-3">Ordem</th><th className="py-2.5 px-3">Status</th><th className="py-2.5 px-3 text-right">Acoes</th></tr></thead>
                <tbody className="divide-y divide-brand-terciar/10">
                  {menuPermissions.map((item) => (
                    <tr key={item.href} className="hover:bg-brand-principal/10">
                      <td className="py-3 px-3 font-semibold text-brand-extra1">{item.name}</td>
                      <td className="py-3 px-3 font-mono text-xs text-brand-terciar/70">{item.href}</td>
                      <td className="py-3 px-3"><select value={item.minLevel} onChange={(e) => handleUpdateMenuPermission(item.href, parseInt(e.target.value, 10))} disabled={updatingMenuHref === item.href} aria-label={"Nivel minimo para " + item.name} className="px-2.5 py-1 bg-white border border-brand-terciar/20 rounded-lg text-xs text-brand-terciar focus:outline-none cursor-pointer focus:border-brand-secundar">{uniqueLevels.map((lvl) => <option key={lvl} value={lvl}>Nivel {lvl} ({getLevelLabel(lvl)})</option>)}</select></td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          defaultValue={item.icon || ""}
                          disabled={updatingMenuHref === item.href}
                          onBlur={(e) => {
                            if (e.target.value !== (item.icon || "")) {
                              handleUpdateMenuPermission(item.href, { icon: e.target.value || null });
                            }
                          }}
                          className="w-20 px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          defaultValue={item.order ?? 0}
                          disabled={updatingMenuHref === item.href}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (val !== item.order) {
                              handleUpdateMenuPermission(item.href, { order: val });
                            }
                          }}
                          className="w-12 px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={item.isActive !== false ? "true" : "false"}
                          disabled={updatingMenuHref === item.href}
                          onChange={(e) => handleUpdateMenuPermission(item.href, { isActive: e.target.value === "true" })}
                          className="px-2 py-1 bg-white border border-brand-terciar/20 rounded-lg text-xs text-brand-terciar focus:outline-none cursor-pointer focus:border-brand-secundar"
                        >
                          <option value="true">Ativo</option>
                          <option value="false">Inativo</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {updatingMenuHref === item.href ? <span className="w-3.5 h-3.5 border border-brand-secundar border-t-transparent rounded-full animate-spin inline-block" /> : (
                          <button onClick={() => handleDeleteMenuPermission(item.href, item.name)} disabled={deletingMenuPermHref === item.href} className="p-1 text-red-650 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer" title="Excluir" aria-label={"Excluir " + item.name}><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-brand-terciar" /> Trilha de Auditoria Geral</h2>
            <div className="flex items-center gap-2">
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} aria-label="Filtrar acoes" className="bg-brand-principal/40 border border-brand-terciar/15 text-xs rounded-lg px-2.5 py-1 text-brand-terciar focus:outline-none cursor-pointer focus:bg-white">
                <option value="ALL">Todas as Acoes</option><option value="LOGIN">LOGIN</option><option value="ACESSO_PAINEL">ACESSO_PAINEL</option><option value="ALTERAR_HIERARQUIA">ALTERAR_HIERARQUIA</option><option value="UPLOAD_DOCUMENT">UPLOAD_DOCUMENT</option><option value="CONFIGURAR_CARGO">CONFIGURAR_CARGO</option>
              </select>
              <button onClick={loadLogs} disabled={loadingLogs} aria-label="Atualizar logs" className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/40 hover:bg-brand-principal/80 text-brand-terciar hover:text-brand-secundar cursor-pointer disabled:opacity-50"><RefreshCw className={"w-3.5 h-3.5" + (loadingLogs ? " animate-spin" : "")} /></button>
            </div>
          </div>
          <div className="space-y-2">
            {loadingLogs ? (
              <div className="space-y-2 py-4"><div className="h-10 bg-brand-principal animate-pulse rounded-lg" /><div className="h-10 bg-brand-principal animate-pulse rounded-lg" /></div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-xs text-brand-terciar/50 text-center py-8">Nenhum log correspondente encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-brand-terciar/10 bg-brand-principal/20 text-xs gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-bold text-brand-extra1">{log.userName}</span>
                        <span className={"text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase " + getLogActionColor(log.action)}>{log.action}</span>
                      </div>
                      <p className="text-brand-terciar/85 leading-normal">{log.details}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] text-brand-terciar/50 font-mono">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-brand-terciar/45" />{log.ipAddress || "127.0.0.1"}</span>
                      <span className="flex items-center gap-1 max-w-[150px] truncate" title={log.userAgent}><Terminal className="w-3 h-3 text-brand-terciar/45" />{log.userAgent ? log.userAgent.split(" ")[0] : "Browser"}</span>
                      <span className="text-brand-terciar/40">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
