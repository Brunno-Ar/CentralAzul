"use client";

import { useState } from "react";
import { Plus, X, Pencil, Trash2, Building2 } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { motion, AnimatePresence } from "framer-motion";
import type { Company } from "@/types/company";

interface EmpresasClientProps {
  initialCompanies: Company[];
  userLevel: number;
}

const colorOptions = [
  { value: "WINE", label: "Borgo Wine" },
  { value: "RED", label: "Maple Bear Red" },
  { value: "AZUL", label: "Azul" },
  { value: "GOLD", label: "Central Gold" },
  { value: "BRONZE", label: "Bronze" },
  { value: "GREEN", label: "Green" },
  { value: "BLUE", label: "Blue" },
  { value: "PURPLE", label: "Purple" },
];

function getColorBadgeClasses(color: string | null) {
  if (!color) return "bg-gray-100 text-gray-800 border-gray-300";
  const m: Record<string, string> = {
    WINE: "bg-brand-terciar text-brand-principal border-brand-terciar/30",
    RED: "bg-brand-secundar text-white border-brand-secundar/30",
    AZUL: "bg-brand-extra2 text-white border-brand-extra2/30",
    GOLD: "bg-brand-principal text-brand-extra1 border-brand-secundar/30",
    BRONZE: "bg-yellow-100 text-yellow-800 border-yellow-300",
    GREEN: "bg-green-100 text-green-800 border-green-300",
    BLUE: "bg-blue-100 text-blue-800 border-blue-300",
    PURPLE: "bg-purple-100 text-purple-800 border-purple-300",
  };
  return m[color] || "bg-gray-100 text-gray-800 border-gray-300";
}

function generateSlug(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9s-]/g, "").trim().replace(/s+/g, "-").replace(/-+/g, "-");
}

export default function EmpresasClient({ initialCompanies, userLevel }: EmpresasClientProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = userLevel === 1;
  const closeCreate = () => setShowCreateModal(false);
  const closeEdit = () => { setShowEditModal(false); setEditingCompany(null); };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      slug: (fd.get("slug") as string) || generateSlug(fd.get("name") as string),
      color: (fd.get("color") as string) || "AZUL",
      holding: (fd.get("holding") as string) || "CENTRAL",
      isActive: fd.get("isActive") === "on",
      showOnHome: fd.get("showOnHome") === "on",
      order: Number(fd.get("order")) || 0,
    };
    setSubmitting(true); setMessage(null);
    try {
      const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { const nc = await res.json(); setCompanies((p) => [nc, ...p]); closeCreate(); setMessage({ type: "success", text: "Empresa criada com sucesso" }); }
      else { const err = await res.json(); setMessage({ type: "error", text: err.error || "Erro ao criar empresa" }); }
    } catch { setMessage({ type: "error", text: "Erro de conexao" }); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCompany) return;
    const fd = new FormData(e.currentTarget);
    const data = {
      id: editingCompany.id,
      name: fd.get("name") as string,
      slug: (fd.get("slug") as string) || editingCompany.slug,
      color: (fd.get("color") as string) || editingCompany.color || "AZUL",
      holding: (fd.get("holding") as string) || editingCompany.holding || "CENTRAL",
      isActive: fd.get("isActive") === "on",
      showOnHome: fd.get("showOnHome") === "on",
      order: Number(fd.get("order")) || editingCompany.order,
    };
    setSubmitting(true); setMessage(null);
    try {
      const res = await fetch("/api/companies", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { const uc = await res.json(); setCompanies((p) => p.map((c) => (c.id === uc.id ? uc : c))); closeEdit(); setMessage({ type: "success", text: "Empresa atualizada com sucesso" }); }
      else { const err = await res.json(); setMessage({ type: "error", text: err.error || "Erro ao atualizar" }); }
    } catch { setMessage({ type: "error", text: "Erro de conexao" }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm("Tem certeza que deseja excluir " + name + "? Esta acao nao pode ser desfeita.")) return;
    try {
      const res = await fetch("/api/companies?id=" + id, { method: "DELETE" });
      if (res.ok) { setCompanies((p) => p.filter((c) => c.id !== id)); setMessage({ type: "success", text: "Empresa excluida" }); }
      else { const err = await res.json(); setMessage({ type: "error", text: err.error || "Erro ao excluir" }); }
    } catch { setMessage({ type: "error", text: "Erro de conexao" }); }
  };

  return (
    <PageWrapper title="Empresas">
      <div className="space-y-6 text-brand-terciar">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-brand-extra1">Empresas</h1>
            <p className="text-xs text-brand-terciar/70">Gerencie as empresas do grupo</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Nova Empresa
            </button>
          )}
        </div>

        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={"p-3 rounded-lg text-xs border " + (message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" : "border-red-200 bg-red-50 text-red-800")} onClick={() => setMessage(null)}>
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company, idx) => (
            <motion.div key={company.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 * idx }} className="flex flex-col p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={"p-2 rounded-xl " + getColorBadgeClasses(company.color)}><Building2 className="w-4 h-4" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-extra1">{company.name}</h3>
                    <p className="text-[10px] font-mono text-brand-terciar/50">/{company.slug}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={"text-[9px] font-mono px-1.5 py-0.5 rounded border " + getColorBadgeClasses(company.color)}>{company.color || "-"}</span>
                  <span className={"text-[9px] font-semibold " + (company.isActive ? "text-emerald-700" : "text-red-600")}>{company.isActive ? "ATIVA" : "INATIVA"}</span>
                </div>
              </div>
              <div className="space-y-1 mb-4 text-[10px] text-brand-terciar/70">
                <p>Holding: <span className="font-mono text-brand-extra1">{company.holding || "-"}</span></p>
                <p>Ordem: <span className="font-mono text-brand-extra1">#{company.order}</span></p>
                <p>Home: <span className={company.showOnHome ? "text-emerald-700 font-semibold" : "text-brand-terciar/50"}>{company.showOnHome ? "Sim" : "Nao"}</span></p>
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t border-brand-terciar/10">
                  <button onClick={() => { setEditingCompany(company); setShowEditModal(true); }} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] bg-brand-principal/20 hover:bg-brand-principal/40 text-brand-extra1 transition-colors cursor-pointer"><Pencil className="w-3 h-3" /> Editar</button>
                  <button onClick={() => handleDelete(company.id, company.name)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer"><Trash2 className="w-3 h-3" /> Excluir</button>
                </div>
              )}
            </motion.div>
          ))}
          {companies.length === 0 && (
            <div className="col-span-full text-center py-12 border-dashed border border-brand-terciar/20 bg-white rounded-2xl">
              <p className="text-sm text-brand-terciar/50">Nenhuma empresa cadastrada</p>
              {isAdmin && <button onClick={() => setShowCreateModal(true)} className="mt-3 px-4 py-1.5 bg-brand-extra2 text-white font-bold rounded-lg text-xs cursor-pointer">Criar Primeira Empresa</button>}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onMouseDown={closeCreate}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-brand-terciar/10" onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-brand-terciar/10">
                <h2 className="text-lg font-bold text-brand-extra1 flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Empresa</h2>
                <button onClick={closeCreate} className="p-1.5 rounded-lg hover:bg-brand-terciar/10 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Nome *</label>
                    <input name="name" required placeholder="Ex: Borgo" className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Slug</label>
                    <input name="slug" placeholder="ex: borgo" className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Cor</label>
                    <select name="color" className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar cursor-pointer">
                      {colorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Holding</label>
                    <input name="holding" defaultValue="CENTRAL" className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Ordem</label>
                    <input name="order" type="number" defaultValue="0" className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar" />
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked className="w-4 h-4" /> <span className="text-[10px] font-mono">Ativo</span></label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="showOnHome" defaultChecked className="w-4 h-4" /> <span className="text-[10px] font-mono">Mostrar na home</span></label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-brand-terciar/10">
                  <button type="button" onClick={closeCreate} className="px-4 py-2 border rounded-lg text-xs cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50">{submitting ? "Criando..." : "Criar Empresa"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && editingCompany && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onMouseDown={closeEdit}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-brand-terciar/10" onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-brand-terciar/10">
                <h2 className="text-lg font-bold text-brand-extra1 flex items-center gap-2"><Pencil className="w-4 h-4" /> Editar Empresa</h2>
                <button onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-brand-terciar/10 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Nome *</label>
                    <input name="name" required defaultValue={editingCompany.name} className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Slug</label>
                    <input name="slug" defaultValue={editingCompany.slug} className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Cor</label>
                    <select name="color" defaultValue={editingCompany.color || "AZUL"} className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar cursor-pointer">
                      {colorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Holding</label>
                    <input name="holding" defaultValue={editingCompany.holding || "CENTRAL"} className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-brand-terciar/70">Ordem</label>
                    <input name="order" type="number" defaultValue={editingCompany.order} className="w-full px-3 py-2 bg-white border border-brand-terciar/15 rounded-lg text-xs focus:outline-none focus:border-brand-secundar" />
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={editingCompany.isActive} className="w-4 h-4" /> <span className="text-[10px] font-mono">Ativo</span></label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="showOnHome" defaultChecked={editingCompany.showOnHome} className="w-4 h-4" /> <span className="text-[10px] font-mono">Mostrar na home</span></label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-brand-terciar/10">
                  <button type="button" onClick={closeEdit} className="px-4 py-2 border rounded-lg text-xs cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50">{submitting ? "Salvando..." : "Salvar Alteracoes"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
