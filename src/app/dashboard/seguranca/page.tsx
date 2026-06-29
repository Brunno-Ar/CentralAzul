"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Users, 
  Lock, 
  RefreshCw, 
  Globe, 
  Terminal,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Sliders
} from "lucide-react";
import { SessionUser } from "@/types/auth";
import { PageWrapper } from "@/components/PageWrapper";

interface UserItem {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  hierarchyLevel: number;
  status: string;
  createdAt: string;
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

interface RoleConfig {
  id: string;
  name: string;
  displayName: string;
  hierarchyLevel: number;
  createdAt: string;
  updatedAt: string;
}

export default function SegurancaPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  
  // Custom Roles state
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplay, setNewRoleDisplay] = useState("");
  const [newRoleLevel, setNewRoleLevel] = useState(3);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDisplay, setEditRoleDisplay] = useState("");
  const [editRoleLevel, setEditRoleLevel] = useState(3);
  
  // Messages
  const [roleMessage, setRoleMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Custom Users state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("VIEWER");
  const [newUserLevel, setNewUserLevel] = useState(3);
  const [userMessage, setUserMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dynamic Menu Permissions state
  interface MenuPermissionItem {
    href: string;
    name: string;
    minLevel: number;
  }

  const [menuPermissions, setMenuPermissions] = useState<MenuPermissionItem[]>([]);
  const [loadingMenuPerms, setLoadingMenuPerms] = useState(true);

  // Menu permissions form state
  const [updatingMenuHref, setUpdatingMenuHref] = useState<string | null>(null);
  const [menuPermMessage, setMenuPermMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Policy Toggles
  const [restrictDomain, setRestrictDomain] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(false);

  const currentUser = session?.user as SessionUser | undefined;
  const isUserAdmin = currentUser?.role === "ADMIN" || currentUser?.hierarchyLevel === 1;

  const loadUsers = useCallback(async () => {
    if (!isUserAdmin) return;
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }, [isUserAdmin]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const loadMenuPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/menu-permissions");
      if (res.ok) {
        const data = await res.json();
        setMenuPermissions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMenuPerms(false);
    }
  }, []);

  useEffect(() => {
    if (isUserAdmin) {
      const timer = setTimeout(() => {
        loadUsers();
        loadRoles();
        loadLogs();
        loadMenuPermissions();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isUserAdmin, loadUsers, loadRoles, loadLogs, loadMenuPermissions]);

  const handleUpdateUser = async (userId: string, updates: Partial<UserItem>) => {
    setUpdatingUserId(userId);
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const body = {
      userId,
      role: updates.role ?? targetUser.role,
      hierarchyLevel: updates.hierarchyLevel ?? targetUser.hierarchyLevel,
      status: updates.status ?? targetUser.status,
    };

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await Promise.all([loadUsers(), loadLogs()]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Roles management functions
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName || !newRoleDisplay) {
      setRoleMessage({ type: "error", text: "Preencha o identificador e o nome de exibicao" });
      return;
    }
    
    // Clean identifiers to uppercase alphanumeric with underscores
    const cleanName = newRoleName.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          displayName: newRoleDisplay,
          hierarchyLevel: newRoleLevel,
        }),
      });

      if (res.ok) {
        setRoleMessage({ type: "success", text: "Cargo criado com sucesso" });
        setNewRoleName("");
        setNewRoleDisplay("");
        setNewRoleLevel(3);
        setIsCreatingRole(false);
        await Promise.all([loadRoles(), loadUsers(), loadLogs()]);
      } else {
        const errData = await res.json();
        setRoleMessage({ type: "error", text: errData.error || "Erro ao criar cargo" });
      }
    } catch {
      setRoleMessage({ type: "error", text: "Erro na conexao com o servidor" });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword || !newUserRole) {
      setUserMessage({ type: "error", text: "Preencha todos os campos obrigatorios" });
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (res.ok) {
        setUserMessage({ type: "success", text: "Colaborador cadastrado com sucesso" });
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("VIEWER");
        setIsCreatingUser(false);
        await Promise.all([loadUsers(), loadLogs()]);
      } else {
        const errData = await res.json();
        setUserMessage({ type: "error", text: errData.error || "Erro ao criar colaborador" });
      }
    } catch {
      setUserMessage({ type: "error", text: "Erro na conexao com o servidor" });
    }
  };



  const handleUpdateMenuPermission = async (href: string, minLevel: number) => {
    setUpdatingMenuHref(href);
    setMenuPermMessage(null);

    try {
      const res = await fetch("/api/menu-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          href,
          minLevel,
        }),
      });

      if (res.ok) {
        setMenuPermMessage({ type: "success", text: "Permissoes do menu salvas com sucesso" });
        await Promise.all([loadMenuPermissions(), loadLogs()]);
      } else {
        const errData = await res.json();
        setMenuPermMessage({ type: "error", text: errData.error || "Erro ao atualizar permissao" });
      }
    } catch {
      setMenuPermMessage({ type: "error", text: "Erro na conexao com o servidor" });
    } finally {
      setUpdatingMenuHref(null);
    }
  };

  const handleStartEditRole = (role: RoleConfig) => {
    setEditingRoleId(role.id);
    setEditRoleName(role.name);
    setEditRoleDisplay(role.displayName);
    setEditRoleLevel(role.hierarchyLevel);
  };

  const handleUpdateRoleSubmit = async (id: string) => {
    if (!editRoleName || !editRoleDisplay) {
      setRoleMessage({ type: "error", text: "Identificador e nome de exibicao sao obrigatorios" });
      return;
    }

    const cleanName = editRoleName.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

    try {
      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: cleanName,
          displayName: editRoleDisplay,
          hierarchyLevel: editRoleLevel,
        }),
      });

      if (res.ok) {
        setRoleMessage({ type: "success", text: "Cargo atualizado com sucesso" });
        setEditingRoleId(null);
        await Promise.all([loadRoles(), loadUsers(), loadLogs()]);
      } else {
        const errData = await res.json();
        setRoleMessage({ type: "error", text: errData.error || "Erro ao atualizar cargo" });
      }
    } catch {
      setRoleMessage({ type: "error", text: "Erro na conexao com o servidor" });
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (name === "ADMIN" || name === "VIEWER") {
      setRoleMessage({ type: "error", text: "Os cargos padrao ADMIN e VIEWER nao podem ser excluidos" });
      return;
    }

    if (!confirm(`Tem certeza que deseja apagar o cargo '${name}'? Todos os usuarios deste cargo serao redefinidos para VIEWER.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/roles?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRoleMessage({ type: "success", text: "Cargo removido com sucesso" });
        await Promise.all([loadRoles(), loadUsers(), loadLogs()]);
      } else {
        const errData = await res.json();
        setRoleMessage({ type: "error", text: errData.error || "Erro ao remover cargo" });
      }
    } catch {
      setRoleMessage({ type: "error", text: "Erro na conexao com o servidor" });
    }
  };

  const filteredLogs = logs.filter(log => {
    return actionFilter === "ALL" || log.action === actionFilter;
  });

  const getLogActionColor = (action: string) => {
    switch (action) {
      case "LOGIN": return "text-emerald-800 border-emerald-200 bg-emerald-50";
      case "ALTERAR_HIERARQUIA": return "text-red-800 border-red-200 bg-red-50";
      case "UPLOAD_DOCUMENT": return "text-brand-extra2 border-blue-200 bg-blue-50";
      case "CONFIGURAR_CARGO": return "text-amber-800 border-amber-200 bg-amber-50";
      default: return "text-brand-secundar border-brand-secundar/10 bg-brand-principal";
    }
  };

  // Get unique list of levels from roles to show in dropdowns
  const uniqueLevels = Array.from(new Set(roles.map((r) => r.hierarchyLevel))).sort((a, b) => a - b);

  const getLevelLabel = (lvl: number) => {
    if (lvl === 1) return "Direcao Geral";
    if (lvl === 2) return "Coordenacao / Gerencia";
    if (lvl === 3) return "Operacional";
    const roleForLevel = roles.find((r) => r.hierarchyLevel === lvl);
    return roleForLevel ? roleForLevel.displayName : `Nivel ${lvl}`;
  };

  if (!isUserAdmin) {
    return (
      <PageWrapper title="Segurança & Níveis de Acesso">
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
    <PageWrapper title="Segurança & Níveis de Acesso">
      <div className="space-y-8 text-brand-terciar">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
          Seguranca & Niveis de Acesso
        </h1>
        <p className="text-xs text-brand-terciar/70 mt-1">
          Gerencie permissoes de usuarios corporativos, configure cargos customizados e monitore logs de auditoria em tempo real.
        </p>
      </div>

      {/* Grid Policies & Controls - Mobile First */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Policy Config */}
        <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4 lg:col-span-1">
          <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-brand-extra2" />
            Politicas Globais
          </h2>
          
          <div className="space-y-4 pt-2">
            {/* Domain Constraint */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-brand-extra1">Restringir Dominio Outlook</p>
                <p className="text-[10px] text-brand-terciar/70 mt-0.5 leading-relaxed">
                  Permite login profissional apenas para contas @grupoazul.com.br.
                </p>
              </div>
              <button 
                onClick={() => setRestrictDomain(!restrictDomain)}
                className="text-brand-terciar/50 hover:text-brand-extra1 cursor-pointer"
              >
                {restrictDomain ? <ToggleRight className="w-9 h-9 text-emerald-600" /> : <ToggleLeft className="w-9 h-9 text-brand-terciar/30" />}
              </button>
            </div>

            {/* MFA Policy */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-brand-extra1">Exigir MFA Corporativo</p>
                <p className="text-[10px] text-brand-terciar/70 mt-0.5 leading-relaxed">
                  Verifica se o usuario completou a autenticacao multifator no Entra ID.
                </p>
              </div>
              <button 
                onClick={() => setMfaRequired(!mfaRequired)}
                className="text-brand-terciar/50 hover:text-brand-extra1 cursor-pointer"
              >
                {mfaRequired ? <ToggleRight className="w-9 h-9 text-emerald-600" /> : <ToggleLeft className="w-9 h-9 text-brand-terciar/30" />}
              </button>
            </div>

            {/* Session Timeout */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-brand-extra1">Expiracao Rapida de Sessao</p>
                <p className="text-[10px] text-brand-terciar/70 mt-0.5 leading-relaxed">
                  Desconecta o usuario apos 15 minutos de inatividade.
                </p>
              </div>
              <button 
                onClick={() => setSessionTimeout(!sessionTimeout)}
                className="text-brand-terciar/50 hover:text-brand-extra1 cursor-pointer"
              >
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
              <Users className="w-3.5 h-3.5 text-brand-terciar" />
              Controle de Hierarquia & Contas
            </h2>
            <button
              onClick={() => {
                setUserMessage(null);
                setIsCreatingUser(!isCreatingUser);
              }}
              className="flex items-center justify-center gap-1.5 self-start sm:self-center px-3 py-1.5 bg-brand-secundar text-white font-bold rounded-lg text-xs hover:bg-brand-secundar/90 transition-colors cursor-pointer transform-gpu"
            >
              {isCreatingUser ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  Fechar
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Novo Colaborador
                </>
              )}
            </button>
          </div>

          {userMessage && (
            <div className={`p-3 rounded-lg text-xs border ${
              userMessage.type === "success" 
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" 
                : "border-red-200 bg-red-50 text-red-800"
            }`}>
              {userMessage.text}
            </div>
          )}

          <AnimatePresence>
            {isCreatingUser && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "linear" }}
                onSubmit={handleCreateUser}
                className="overflow-hidden space-y-3 bg-brand-principal/20 p-4 rounded-xl border border-brand-terciar/10 transform-gpu"
              >
                <h3 className="text-xs font-bold text-brand-extra1 uppercase tracking-wider">Novo Colaborador</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Ex: Joao da Silva"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">E-mail</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="Ex: joao@grupoazul.com.br"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Senha de Acesso</label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Senha forte"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Cargo</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar cursor-pointer"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.displayName} (Nivel {r.hierarchyLevel})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-brand-secundar text-white font-bold rounded-lg text-xs hover:bg-brand-secundar/90 transition-colors cursor-pointer"
                  >
                    Salvar Colaborador
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            {loadingUsers || loadingRoles ? (
              <div className="space-y-2 py-4">
                <div className="h-8 bg-brand-principal animate-pulse rounded-lg" />
                <div className="h-8 bg-brand-principal animate-pulse rounded-lg" />
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-terciar/10 text-brand-terciar/60 font-mono text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 px-2">Usuario</th>
                    <th className="py-2.5 px-2">Cargo / Nivel</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-terciar/10">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-brand-principal/20">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={u.image} alt={u.name} className="w-6 h-6 rounded-full object-cover border border-brand-terciar/10" />
                          <div className="min-w-0">
                            <p className="font-bold text-brand-extra1 truncate max-w-[120px] sm:max-w-none">{u.name}</p>
                            <p className="text-[10px] text-brand-terciar/60 truncate max-w-[120px] sm:max-w-none">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                          <select
                            value={u.role}
                            disabled={updatingUserId === u.id || u.id === currentUser.id}
                            onChange={(e) => {
                              handleUpdateUser(u.id, { role: e.target.value });
                            }}
                            className="bg-brand-principal/40 border border-brand-terciar/15 text-[10px] rounded px-1.5 py-0.5 text-brand-terciar focus:outline-none cursor-pointer focus:bg-white"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.displayName}
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-brand-terciar/50 font-mono">
                            (Lvl {u.hierarchyLevel})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={u.status}
                          disabled={updatingUserId === u.id || u.id === currentUser.id}
                          onChange={(e) => handleUpdateUser(u.id, { status: e.target.value })}
                          className={`bg-brand-principal/40 border border-brand-terciar/15 text-[10px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer focus:bg-white ${
                            u.status === "ACTIVE" ? "text-emerald-700 font-bold" : "text-red-700 font-bold"
                          }`}
                        >
                          <option value="ACTIVE">ATIVO</option>
                          <option value="BLOCKED">BLOQ</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {updatingUserId === u.id ? (
                          <span className="w-3 h-3 border border-brand-secundar border-t-transparent rounded-full animate-spin inline-block" />
                        ) : (
                          <span className="text-[10px] text-brand-terciar/40 font-mono">Ok</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Custom Roles Config Card */}
      <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-brand-terciar" />
            Configuracao de Cargos & Niveis de Hierarquia
          </h2>

          <button
            onClick={() => {
              setRoleMessage(null);
              setIsCreatingRole(!isCreatingRole);
            }}
            className="flex items-center justify-center gap-1.5 self-start sm:self-center px-3 py-1.5 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 transition-colors cursor-pointer"
          >
            {isCreatingRole ? (
              <>
                <X className="w-3 h-3" />
                Fechar
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                Novo Cargo
              </>
            )}
          </button>
        </div>

        {roleMessage && (
          <div className={`p-3 rounded-lg text-xs border ${
            roleMessage.type === "success" 
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" 
              : "border-red-200 bg-red-50 text-red-800"
          }`}>
            {roleMessage.text}
          </div>
        )}

        {/* Create Role Form */}
        <AnimatePresence>
          {isCreatingRole && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleCreateRole} className="p-4 rounded-xl bg-brand-principal/20 border border-brand-terciar/10 space-y-4">
                <h3 className="text-xs font-bold text-brand-extra1">Adicionar Novo Cargo</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Identificador (Ex: GERENTE_VENDAS)</label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Ex: COORDENADOR_TI"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome de Exibicao</label>
                    <input
                      type="text"
                      required
                      value={newRoleDisplay}
                      onChange={(e) => setNewRoleDisplay(e.target.value)}
                      placeholder="Ex: Coordenador de TI"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nivel de Hierarquia</label>
                    <select
                      value={newRoleLevel}
                      onChange={(e) => setNewRoleLevel(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors cursor-pointer"
                    >
                      <option value="1">Nivel 1 (Direcao Geral)</option>
                      <option value="2">Nivel 2 (Coordenacao / Gerencia)</option>
                      <option value="3">Nivel 3 (Operacional)</option>
                      <option value="4">Nivel 4 (Customizado)</option>
                      <option value="5">Nivel 5 (Customizado)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingRole(false)}
                    className="px-3 py-1.5 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:bg-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/95 shadow-sm transition-colors cursor-pointer"
                  >
                    Salvar Cargo
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roles Table */}
        <div className="overflow-x-auto border border-brand-terciar/10 rounded-xl">
          {loadingRoles ? (
            <div className="p-4 text-xs text-brand-terciar/50 text-center animate-pulse">Carregando cargos...</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-terciar/10 bg-brand-principal/10 text-brand-terciar/60 font-mono text-[9px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Identificador</th>
                  <th className="py-2.5 px-3">Nome de Exibicao</th>
                  <th className="py-2.5 px-3">Nivel de Hierarquia</th>
                  <th className="py-2.5 px-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-terciar/10">
                {roles.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-principal/10">
                    <td className="py-3 px-3 font-mono text-xs text-brand-extra1">
                      {editingRoleId === r.id ? (
                        <input
                          type="text"
                          value={editRoleName}
                          onChange={(e) => setEditRoleName(e.target.value)}
                          className="px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none"
                        />
                      ) : (
                        r.name
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-brand-terciar">
                      {editingRoleId === r.id ? (
                        <input
                          type="text"
                          value={editRoleDisplay}
                          onChange={(e) => setEditRoleDisplay(e.target.value)}
                          className="px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none"
                        />
                      ) : (
                        r.displayName
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs">
                      {editingRoleId === r.id ? (
                        <select
                          value={editRoleLevel}
                          onChange={(e) => setEditRoleLevel(parseInt(e.target.value, 10))}
                          className="px-2 py-1 bg-white border border-brand-terciar/20 rounded text-xs text-brand-terciar focus:outline-none cursor-pointer"
                        >
                          <option value="1">1 (Direcao)</option>
                          <option value="2">2 (Gerencia)</option>
                          <option value="3">3 (Operacao)</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-brand-extra1">
                          Nivel {r.hierarchyLevel} ({r.hierarchyLevel === 1 ? "Direcao" : r.hierarchyLevel === 2 ? "Gerencia" : "Operacao"})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {editingRoleId === r.id ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateRoleSubmit(r.id)}
                            className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer"
                            title="Salvar Alteracoes"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingRoleId(null)}
                            className="p-1 text-brand-terciar/70 bg-brand-principal hover:bg-brand-terciar/10 rounded border border-brand-terciar/15 cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEditRole(r)}
                            className="p-1 text-brand-secundar bg-brand-principal hover:bg-brand-principal/70 rounded border border-brand-terciar/15 cursor-pointer"
                            title="Editar Cargo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {r.name !== "ADMIN" && r.name !== "VIEWER" && (
                            <button
                              onClick={() => handleDeleteRole(r.id, r.name)}
                              className="p-1 text-red-650 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer"
                              title="Excluir Cargo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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


      {/* Menu Permissions Card */}
      <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
        <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-brand-terciar" />
          Permissoes de Acesso por Aba do Menu
        </h2>

        {menuPermMessage && (
          <div className={`p-3 rounded-lg text-xs border ${
            menuPermMessage.type === "success" 
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" 
              : "border-red-200 bg-red-50 text-red-800"
          }`}>
            {menuPermMessage.text}
          </div>
        )}

        <div className="overflow-x-auto border border-brand-terciar/10 rounded-xl">
          {loadingMenuPerms ? (
            <div className="p-4 text-xs text-brand-terciar/50 text-center animate-pulse">Carregando permissoes do menu...</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-terciar/10 bg-brand-principal/10 text-brand-terciar/60 font-mono text-[9px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Nome da Aba</th>
                  <th className="py-2.5 px-3">Caminho (Link)</th>
                  <th className="py-2.5 px-3">Nivel Minimo Exigido</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-terciar/10">
                {menuPermissions.map((item) => (
                  <tr key={item.href} className="hover:bg-brand-principal/10">
                    <td className="py-3 px-3 font-semibold text-brand-extra1">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-brand-terciar/70">
                      {item.href}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.minLevel}
                        onChange={(e) => handleUpdateMenuPermission(item.href, parseInt(e.target.value, 10))}
                        disabled={updatingMenuHref === item.href}
                        className="px-2.5 py-1 bg-white border border-brand-terciar/20 rounded-lg text-xs text-brand-terciar focus:outline-none cursor-pointer focus:border-brand-secundar"
                      >
                        {uniqueLevels.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Nivel {lvl} ({getLevelLabel(lvl)})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {updatingMenuHref === item.href ? (
                        <span className="w-3.5 h-3.5 border border-brand-secundar border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        <span className="text-[10px] text-brand-terciar/40 font-mono">Salvo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Audit Logs panel */}
      <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-brand-terciar" />
            Trilha de Auditoria Geral
          </h2>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-brand-principal/40 border border-brand-terciar/15 text-xs rounded-lg px-2.5 py-1 text-brand-terciar focus:outline-none cursor-pointer focus:bg-white"
            >
              <option value="ALL">Todas as Acoes</option>
              <option value="LOGIN">LOGIN</option>
              <option value="ACESSO_PAINEL">ACESSO_PAINEL</option>
              <option value="ALTERAR_HIERARQUIA">ALTERAR_HIERARQUIA</option>
              <option value="UPLOAD_DOCUMENT">UPLOAD_DOCUMENT</option>
              <option value="CONFIGURAR_CARGO">CONFIGURAR_CARGO</option>
            </select>

            <button
              onClick={loadLogs}
              disabled={loadingLogs}
              className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/40 hover:bg-brand-principal/80 text-brand-terciar hover:text-brand-secundar cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* List of logs */}
        <div className="space-y-2">
          {loadingLogs ? (
            <div className="space-y-2 py-4">
              <div className="h-10 bg-brand-principal animate-pulse rounded-lg" />
              <div className="h-10 bg-brand-principal animate-pulse rounded-lg" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-xs text-brand-terciar/50 text-center py-8">Nenhum log correspondente encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-brand-terciar/10 bg-brand-principal/20 text-xs gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold text-brand-extra1">{log.userName}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getLogActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-brand-terciar/85 leading-normal">{log.details}</p>
                  </div>

                  <div className="flex items-center gap-4 text-[9px] text-brand-terciar/50 font-mono border-t border-brand-terciar/10 sm:border-0 pt-2 sm:pt-0">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-brand-terciar/45" />
                      {log.ipAddress || "127.0.0.1"}
                    </span>
                    <span className="flex items-center gap-1 max-w-[150px] truncate" title={log.userAgent}>
                      <Terminal className="w-3 h-3 text-brand-terciar/45" />
                      {log.userAgent ? log.userAgent.split(" ")[0] : "Browser"}
                    </span>
                    <span className="text-brand-terciar/40">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </span>
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
