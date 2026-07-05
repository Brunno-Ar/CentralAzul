"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import NextImage from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Building2, MapPin, Phone, Mail, Plus } from "lucide-react";
import { SessionUser } from "@/types/auth";
import {
  type BusinessUnit,
  formatNumber,
  getLatestMeta,
  getLatestAnalytics,
  getLatestRevenue,
} from "@/types/business-unit";
import { PageWrapper } from "@/components/PageWrapper";
import { SearchInput } from "@/components/ui/SearchInput";
import { Modal } from "@/components/ui/Modal";

const companyColors: Record<string, string> = {
  BORGO: "text-brand-terciar bg-brand-terciar/10 border-brand-terciar/30",
  MAPLE_BEAR:
    "text-brand-secundar bg-brand-secundar/10 border-brand-secundar/30",
  AZUL: "text-brand-extra2 bg-brand-extra2/10 border-brand-extra2/30",
  CENTRAL: "text-brand-extra1 bg-brand-principal/20 border-brand-secundar/30",
};

const companyLabels: Record<string, string> = {
  BORGO: "Borgo del Vin",
  MAPLE_BEAR: "Maple Bear",
  AZUL: "Azul Incorporações",
  CENTRAL: "Central / Geral",
};

export default function BusinessUnitsListPage() {
  const { data: session } = useSession();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const user = session?.user as SessionUser | undefined;
  const userLevel = user?.hierarchyLevel || 3;
  const isAdmin = userLevel === 1;

  useEffect(() => {
    const fetchBusinessUnits = async () => {
      try {
        const res = await fetch("/api/business-units");
        if (res.ok) {
          const data = await res.json();
          setBusinessUnits(data);
        }
      } catch (err) {
        console.error("Erro ao carregar unidades:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessUnits();
  }, []);

  const filteredUnits = businessUnits.filter((bu) => {
    const matchesSearch =
      bu.name.toLowerCase().includes(search.toLowerCase()) ||
      bu.description.toLowerCase().includes(search.toLowerCase()) ||
      bu.company.toLowerCase().includes(search.toLowerCase());
    const matchesCompany =
      companyFilter === "ALL" || bu.company === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const handleCreate = async (formData: FormData) => {
    const data = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      company: formData.get("company"),
      description: formData.get("description") || "",
      address: formData.get("address") || "",
      phone: formData.get("phone") || "",
      email: formData.get("email") || "",
      website: formData.get("website") || "",
      isActive: true,
      order: 0,
    };

    try {
      const res = await fetch("/api/business-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const newBU = await res.json();
        setBusinessUnits((prev) => [newBU, ...prev]);
        setShowCreateModal(false);
        setMessage({ type: "success", text: "Unidade criada com sucesso" });
      } else {
        const err = await res.json();
        setMessage({
          type: "error",
          text: err.error || "Erro ao criar unidade",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    }
  };

  const companies = [
    { value: "BORGO", label: "Borgo del Vin" },
    { value: "MAPLE_BEAR", label: "Maple Bear" },
    { value: "AZUL", label: "Azul Incorporações" },
    { value: "CENTRAL", label: "Central / Geral" },
  ];

  return (
    <PageWrapper title="Unidades de Negócio">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
            Unidades de Negócio
          </h1>
          <p className="text-xs text-brand-terciar/70 mt-1">
            Gerencie empreendimentos, escolas e unidades do grupo
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-1.5 self-start sm:self-center px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Unidade
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 py-2 border-y border-brand-terciar/10 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar unidade..."
        />

        <div className="flex items-center gap-2">
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-brand-terciar/10 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors cursor-pointer"
          >
            <option value="ALL">Todas as empresas</option>
            {companies.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Nova Unidade de Negócio
          </span>
        }
        size="md"
      >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate(new FormData(e.currentTarget));
              }}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {message && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    message.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                    Nome *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Ex: Morro de Alvina"
                    className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                    Slug *
                  </label>
                  <input
                    name="slug"
                    required
                    placeholder="Ex: morro-de-alvina"
                    className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                    Empresa *
                  </label>
                  <select
                    name="company"
                    required
                    className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="">Selecione</option>
                    {companies.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Descreva a unidade..."
                    className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Telefone
                    </label>
                    <input
                      name="phone"
                      placeholder="(11) 9999-9999"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      E-mail
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Endereço
                    </label>
                    <input
                      name="address"
                      placeholder="Rua, número, bairro, cidade"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Website
                    </label>
                    <input
                      name="website"
                      placeholder="https://empresa.com"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-brand-terciar/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:text-brand-extra1 hover:bg-brand-principal/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors"
                >
                  Criar Unidade
                </button>
              </div>
            </form>
      </Modal>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg text-xs border ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-white animate-pulse rounded-xl border border-brand-terciar/10"
            />
          ))}
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-brand-terciar/20 bg-white rounded-2xl">
          <Building2 className="w-12 h-12 text-brand-terciar/20 mx-auto mb-3" />
          <p className="text-sm text-brand-terciar/50">
            {search || companyFilter !== "ALL"
              ? "Nenhuma unidade encontrada com os filtros aplicados."
              : 'Nenhuma unidade cadastrada. Clique em "Nova Unidade" para começar.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUnits.map((bu) => (
            <motion.div
              key={bu.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group p-4 rounded-xl border bg-white hover:border-brand-secundar hover:shadow-md transition-all"
            >
              <Link href={`/dashboard/unidades/${bu.slug}`} className="block">
                <div className="flex items-start gap-4">
                  {/* Cover/Logo */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-brand-principal/30 border border-brand-terciar/10">
                    {bu.coverImage ? (
                      <NextImage
                        src={bu.coverImage}
                        alt={bu.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 96px, 96px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-brand-terciar/30" />
                      </div>
                    )}
                    {bu.isActive && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded bg-emerald-500 text-white">
                        Ativo
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-brand-extra1 truncate">
                        {bu.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-medium rounded border ${companyColors[bu.company] || "text-brand-terciar bg-brand-principal/20 border-brand-terciar/20"}`}
                      >
                        {companyLabels[bu.company] || bu.company}
                      </span>
                    </div>
                    <p className="text-xs text-brand-terciar/70 line-clamp-2 mb-2">
                      {bu.description || "Sem descrição"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-brand-terciar/50">
                      {bu.address && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3" />
                          {bu.address}
                        </span>
                      )}
                      {bu.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {bu.phone}
                        </span>
                      )}
                      {bu.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {bu.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-2 shrink-0 w-40">
                    <div className="text-right">
                      <p className="text-xs text-brand-terciar/50">
                        Seguidores
                      </p>
                      <p className="text-sm font-bold text-brand-extra1">
                        {getLatestMeta(bu)
                          ? formatNumber(getLatestMeta(bu)!.followersCount)
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-brand-terciar/50">
                        Page Views
                      </p>
                      <p className="text-sm font-bold text-brand-extra1">
                        {getLatestAnalytics(bu)
                          ? formatNumber(getLatestAnalytics(bu)!.pageViews)
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-brand-terciar/50">
                        Faturamento
                      </p>
                      <p className="text-sm font-bold text-brand-extra1">
                        {getLatestRevenue(bu)
                          ? `R$ ${formatNumber(getLatestRevenue(bu)!.amount)}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    </PageWrapper>
  );
}
