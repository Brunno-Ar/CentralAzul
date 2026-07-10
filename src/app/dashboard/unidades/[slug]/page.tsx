"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import NextImage from "next/image";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Image,
  Users,
  Link,
  Video,
  Music,
  BarChart3,
  TrendingUp,
  DollarSign,
  Settings,
  ChevronLeft,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Plus,
  Upload,
} from "lucide-react";
import { SessionUser } from "@/types/auth";
import type {
  BusinessUnitAnalyticsSerialized,
  BusinessUnitMetaDataSerialized,
  BusinessUnitRevenueSerialized,
} from "@/types/analytics";
import FocusLock from "react-focus-lock";

interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  company: string;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  tools: BusinessUnitTool[];
  socialLinks: BusinessUnitSocialLink[];
  analytics: BusinessUnitAnalyticsSerialized[];
  metaData: BusinessUnitMetaDataSerialized[];
  revenueData: BusinessUnitRevenueSerialized[];
}

interface BusinessUnitTool {
  id: string;
  businessUnitId: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  isExternal: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BusinessUnitSocialLink {
  id: string;
  businessUnitId: string;
  platform: string;
  url: string;
  handle: string;
  followersCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const platformIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  instagram: Image,
  facebook: Users,
  linkedin: Link,
  youtube: Video,
  tiktok: Music,
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("pt-BR");
};

const getCsrfToken = () => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  if (!match) {
    const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    document.cookie = `csrfToken=${token}; path=/; SameSite=Lax;`;
    return token;
  }
  return match[1];
};

export default function BusinessUnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { data: session } = useSession();
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tools" | "social" | "analytics" | "revenue"
  >("overview");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [editingTool, setEditingTool] = useState<BusinessUnitTool | null>(null);
  const [showAddSocialModal, setShowAddSocialModal] = useState(false);
  const [showAddAnalyticsModal, setShowAddAnalyticsModal] = useState(false);
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false);

  const editModalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const addToolTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleEditItem = async (type: string, id: string, data: unknown) => {
    try {
      const res = await fetch(`/api/business-units/${slug}/items`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        body: JSON.stringify({ type, id, data }),
      });

      if (res.ok) {
        const resData = await fetch(`/api/business-units/${slug}`);
        if (resData.ok) {
          const updatedBu = await resData.json();
          setBusinessUnit(updatedBu);
        }
        setMessage({ type: "success", text: "Item editado com sucesso" });
        return true;
      } else {
        try {
          const err = await res.json();
          setMessage({ type: "error", text: err.error || "Erro ao editar item" });
        } catch {
          setMessage({ type: "error", text: "Erro ao editar item" });
        }
        return false;
      }
    } catch {
      setMessage({ type: "error", text: "Erro na conexão" });
      return false;
    }
  };

  const handleAddItem = async (type: string, data: unknown) => {
    try {
      const res = await fetch(`/api/business-units/${slug}/items`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        body: JSON.stringify({ type, data }),
      });

      if (res.ok) {
        const resData = await fetch(`/api/business-units/${slug}`);
        if (resData.ok) {
          const updatedBu = await resData.json();
          setBusinessUnit(updatedBu);
        }
        setMessage({ type: "success", text: "Item adicionado com sucesso" });
        return true;
      } else if (res.status === 501) {
        try {
          const err = await res.json();
          if (err.softError) {
            console.warn("SUBFLOW_UNAVAILABLE: addItem returned softError");
            setMessage({ type: "error", text: err.error || "Funcao em desenvolvimento" });
          } else {
            setMessage({ type: "error", text: err.error || "Erro ao adicionar item" });
          }
        } catch {
          setMessage({ type: "error", text: "Funcao em desenvolvimento" });
        }
        return false;
      } else {
        try {
          const err = await res.json();
          setMessage({ type: "error", text: err.error || "Erro ao adicionar item" });
        } catch {
          setMessage({ type: "error", text: "Erro ao adicionar item" });
        }
        return false;
      }
    } catch {
      setMessage({ type: "error", text: "Erro na conexão" });
      return false;
    }
  };

  const handleDeleteItem = async (type: string, itemId: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;

    try {
      const res = await fetch(`/api/business-units/${slug}/items?type=${type}&id=${itemId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": getCsrfToken()
        }
      });

      if (res.ok) {
        const resData = await fetch(`/api/business-units/${slug}`);
        if (resData.ok) {
          const updatedBu = await resData.json();
          setBusinessUnit(updatedBu);
        }
        setMessage({ type: "success", text: "Item removido com sucesso" });
      } else if (res.status === 501) {
        try {
          const err = await res.json();
          if (err.softError) {
            console.warn("SUBFLOW_UNAVAILABLE: deleteItem returned softError");
            setMessage({ type: "error", text: err.error || "Funcao em desenvolvimento" });
          } else {
            setMessage({ type: "error", text: err.error || "Erro ao remover item" });
          }
        } catch {
          setMessage({ type: "error", text: "Funcao em desenvolvimento" });
        }
      } else {
        try {
          const err = await res.json();
          setMessage({ type: "error", text: err.error || "Erro ao remover item" });
        } catch {
          setMessage({ type: "error", text: "Erro ao remover item" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Erro na conexão" });
    }
  };

  const handleUpdate = async (formData: FormData) => {
    const updates = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      company: formData.get("company") as string,
      description: formData.get("description") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      website: formData.get("website") as string,
      coverImage: formData.get("coverImage") as string,
      logo: formData.get("logo") as string,
    };

    try {
      const res = await fetch(`/api/business-units/${slug}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setBusinessUnit(updated);
        setShowEditModal(false);
        setMessage({ type: "success", text: "Unidade de negócio atualizada com sucesso" });
        
        if (updates.slug !== slug) {
          router.push(`/dashboard/unidades/${updates.slug}`);
        }
      } else if (res.status === 501) {
        try {
          const err = await res.json();
          if (err.softError) {
            console.warn("SUBFLOW_UNAVAILABLE: update returned softError");
            setMessage({ type: "error", text: err.error || "Funcao em desenvolvimento" });
          } else {
            setMessage({ type: "error", text: err.error || "Erro ao atualizar unidade" });
          }
        } catch {
          setMessage({ type: "error", text: "Funcao em desenvolvimento" });
        }
      } else {
        try {
          const err = await res.json();
          setMessage({ type: "error", text: err.error || "Erro ao atualizar unidade" });
        } catch {
          setMessage({ type: "error", text: "Erro ao atualizar unidade" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Erro na conexão" });
    }
  };

  const user = session?.user as SessionUser | undefined;
  const userLevel = user?.hierarchyLevel || 3;
  const isAdmin = userLevel === 1;

  const syncSteps = [
    "Conectando as APIs de monitoramento...",
    "Instagram: Coletando seguidores e métricas de alcance...",
    "YouTube: Consultando estatísticas de inscritos do canal...",
    "Google Analytics: Buscando page views e sessões do site...",
    "Consolidando dados e gravando métricas no banco...",
  ];

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStep(0);

    const syncPromise = fetch(`/api/business-units/${slug}/sync`, {
      method: "POST",
      headers: {
        "X-CSRF-Token": getCsrfToken()
      }
    });

    try {
      const res = await syncPromise;
      if (res.ok) {
        const resData = await fetch(`/api/business-units/${slug}`);
        if (resData.ok) {
          const data = await resData.json();
          setBusinessUnit(data);
        }
        setMessage({ type: "success", text: "Métricas sincronizadas com sucesso" });
      } else if (res.status === 501) {
        try {
          const err = await res.json();
          if (err.softError) {
            console.warn("SUBFLOW_UNAVAILABLE: sync returned softError");
            setMessage({ type: "error", text: err.error || "Funcao em desenvolvimento" });
          } else {
            setMessage({ type: "error", text: err.error || "Erro ao sincronizar dados" });
          }
        } catch {
          setMessage({ type: "error", text: "Funcao em desenvolvimento" });
        }
      } else {
        try {
          const err = await res.json();
          setMessage({ type: "error", text: err.error || "Erro ao sincronizar dados" });
        } catch {
          setMessage({ type: "error", text: "Erro ao sincronizar dados" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Erro na conexão de sincronização" });
    } finally {
      setIsSyncing(false);
      setSyncStep(0);
    }
  };

  useEffect(() => {
    const fetchBusinessUnit = async () => {
      try {
        const res = await fetch(`/api/business-units/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setBusinessUnit(data);
        } else if (res.status === 404) {
          setError("Unidade de negócio não encontrada");
        } else {
          setError("Erro ao carregar unidade de negócio");
        }
      } catch {
        setError("Erro de conexão");
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessUnit();
  }, [slug]);

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir "${businessUnit?.name}"?`))
      return;

    try {
      const res = await fetch(`/api/business-units/${slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Unidade removida com sucesso" });
        router.push("/dashboard");
      } else if (res.status === 501) {
        try {
          const err = await res.json();
          if (err.softError) {
            console.warn("SUBFLOW_UNAVAILABLE: delete returned softError");
            setMessage({ type: "error", text: err.error || "Funcao em desenvolvimento" });
          } else {
            setMessage({ type: "error", text: err.error || "Erro ao remover unidade" });
          }
        } catch {
          setMessage({ type: "error", text: "Funcao em desenvolvimento" });
        }
      } else {
        try {
          const err = await res.json();
          setMessage({ type: "error", text: err.error || "Erro ao remover unidade" });
        } catch {
          setMessage({ type: "error", text: "Erro ao remover unidade" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-brand-terciar/10 rounded w-1/4" />
          <div className="h-48 bg-brand-terciar/10 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-brand-terciar/10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !businessUnit) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-brand-terciar/20 mx-auto mb-3" />
        <p className="text-brand-terciar/50">
          {error || "Unidade não encontrada"}
        </p>
      </div>
    );
  }

  const getLatestAnalytics = () => {
    if (!businessUnit.analytics || !businessUnit.analytics.length) return null;
    return businessUnit.analytics[0];
  };

  const getLatestMeta = () => {
    if (!businessUnit.metaData || !businessUnit.metaData.length) return null;
    return businessUnit.metaData.reduce((latest, current) =>
      new Date(current.date) > new Date(latest.date) ? current : latest,
    );
  };

  const getLatestRevenue = () => {
    if (!businessUnit.revenueData || !businessUnit.revenueData.length) return null;
    return businessUnit.revenueData[0];
  };

  const latestAnalytics = getLatestAnalytics();
  const latestMeta = getLatestMeta();
  const latestRevenue = getLatestRevenue();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            aria-label="Voltar para o dashboard"
            className="p-2 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/60 transition-colors md:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
              {businessUnit.name}
            </h1>
            <p className="text-xs text-brand-terciar/60 uppercase tracking-widest font-mono">
              {businessUnit.company}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userLevel <= 2 && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                aria-label="Sincronizar Metricas"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secundar/10 text-brand-secundar hover:bg-brand-secundar/20 rounded-lg text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-50"
              >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              Sincronizar Métricas
            </button>
          )}

          {isAdmin && (
            <>
              <button aria-label="Visualizar unidade" className="p-2 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/60 transition-colors">
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setCoverUrl(businessUnit.coverImage || "");
                  setLogoUrl(businessUnit.logo || "");
                  setShowEditModal(true);
                }}
                aria-label="Editar unidade de negocio"
                className="p-2 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/60 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                aria-label="Excluir unidade de negocio"
                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cover / Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-principal/50 to-brand-secundar/10 border border-brand-terciar/10"
      >
        {businessUnit.coverImage ? (
          <div className="relative w-full h-48">
            <NextImage
              src={businessUnit.coverImage}
              alt={businessUnit.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-48 flex items-center justify-center">
            <Building2 className="w-16 h-16 text-brand-terciar/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-white text-lg font-bold">
                {businessUnit.name}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {businessUnit.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {businessUnit.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(businessUnit.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white/90 text-xs hover:bg-white/20 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {businessUnit.address}
                </a>
              )}
              {businessUnit.website && (
                <a
                  href={businessUnit.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-extra2/20 backdrop-blur rounded-lg text-white text-xs hover:bg-brand-extra2/30 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Site
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

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

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-brand-terciar/10 overflow-x-auto scrollbar-hide pb-1" role="tablist" aria-label="Secoes da unidade">
        {[
          { id: "overview", label: "Visão Geral", icon: Building2 },
          { id: "tools", label: "Ferramentas", icon: Settings },
          { id: "social", label: "Redes Sociais", icon: Users },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
          { id: "revenue", label: "Faturamento", icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? "bg-brand-secundar text-white shadow-sm"
                : "text-brand-terciar/60 hover:text-brand-secundar hover:bg-brand-principal/20"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-brand-terciar/10 overflow-hidden"
        >
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab" className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  label="Seguidores (Meta)"
                  value={
                    latestMeta ? formatNumber(latestMeta.followersCount) : "-"
                  }
                  iconColor="text-pink-600 bg-pink-50"
                />
                <StatCard
                  icon={BarChart3}
                  label="Page Views (30d)"
                  value={
                    latestAnalytics
                      ? formatNumber(latestAnalytics.pageViews)
                      : "-"
                  }
                  iconColor="text-blue-600 bg-blue-50"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Engajamento"
                  value={
                    latestMeta
                      ? `${latestMeta.engagementRate.toFixed(1)}%`
                      : "-"
                  }
                  iconColor="text-emerald-600 bg-emerald-50"
                />
                <StatCard
                  icon={DollarSign}
                  label="Faturamento"
                  value={
                    latestRevenue ? formatCurrency(latestRevenue.amount) : "-"
                  }
                  iconColor="text-amber-600 bg-amber-50"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand-terciar/10">
                <ContactItem
                  icon={MapPin}
                  label="Endereço"
                  value={businessUnit.address || "-"}
                />
                <ContactItem
                  icon={Phone}
                  label="Telefone"
                  value={businessUnit.phone || "-"}
                />
                <ContactItem
                  icon={Mail}
                  label="E-mail"
                  value={businessUnit.email || "-"}
                />
                <ContactItem
                  icon={Globe}
                  label="Website"
                  value={businessUnit.website ? "Acessar site" : "-"}
                />
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-brand-terciar/10">
                <h3 className="text-sm font-bold text-brand-extra1 mb-3">
                  Ações Rápidas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {businessUnit.website && (
                    <a
                      href={businessUnit.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-secundar text-white rounded-lg text-xs font-medium hover:bg-brand-secundar/90 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Acessar Site
                    </a>
                  )}
                  {businessUnit.email && (
                    <a
                      href={`mailto:${businessUnit.email}`}
                      className="flex items-center gap-1.5 px-4 py-2 border border-brand-terciar/20 rounded-lg text-xs font-medium text-brand-terciar hover:bg-brand-principal/50 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Enviar E-mail
                    </a>
                  )}
                  {businessUnit.phone && (
                    <a
                      href={`tel:${businessUnit.phone.replace(/\D/g, "")}`}
                      className="flex items-center gap-1.5 px-4 py-2 border border-brand-terciar/20 rounded-lg text-xs font-medium text-brand-terciar hover:bg-brand-principal/50 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Ligar
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === "tools" && (
            <div role="tabpanel" id="tools-panel" aria-labelledby="tools-tab" className="p-6">
              {userLevel <= 2 && (
                <button
                  onClick={() => setShowAddToolModal(true)}
                  aria-haspopup="dialog"
                  aria-expanded={showAddToolModal}
                  className="mb-4 flex items-center gap-1.5 px-3 py-1.5 bg-brand-secundar text-white rounded-lg text-xs font-medium hover:bg-brand-secundar/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Ferramenta
                </button>
              )}

              {businessUnit.tools.length === 0 ? (
                <div className="text-center py-8 text-brand-terciar/50">
                  <Settings className="w-12 h-12 mx-auto mb-3 text-brand-terciar/20" />
                  <p>Nenhuma ferramenta cadastrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {businessUnit.tools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onEdit={userLevel <= 2 ? () => setEditingTool(tool) : undefined}
                      onDelete={userLevel <= 2 ? () => handleDeleteItem("tool", tool.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Social Tab */}
          {activeTab === "social" && (
            <div role="tabpanel" id="social-panel" aria-labelledby="social-tab" className="p-6">
              {userLevel <= 2 && (
                <button
                  onClick={() => setShowAddSocialModal(true)}
                  aria-haspopup="dialog"
                  aria-expanded={showAddSocialModal}
                  className="mb-4 flex items-center gap-1.5 px-3 py-1.5 bg-brand-secundar text-white rounded-lg text-xs font-medium hover:bg-brand-secundar/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Vincular Rede Social
                </button>
              )}

              {businessUnit.socialLinks.length === 0 ? (
                <div className="text-center py-8 text-brand-terciar/50">
                  <Users className="w-12 h-12 mx-auto mb-3 text-brand-terciar/20" />
                  <p>Nenhuma rede social cadastrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {businessUnit.socialLinks.map((social) => (
                    <SocialCard
                      key={social.id}
                      social={social}
                      onDelete={userLevel <= 2 ? () => handleDeleteItem("social", social.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div role="tabpanel" id="analytics-panel" aria-labelledby="analytics-tab" className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={BarChart3}
                  label="Page Views"
                  value={
                    latestAnalytics
                      ? formatNumber(latestAnalytics.pageViews)
                      : "-"
                  }
                  iconColor="text-blue-600 bg-blue-50"
                />
                <StatCard
                  icon={Users}
                  label="Visitantes Únicos"
                  value={
                    latestAnalytics
                      ? formatNumber(latestAnalytics.uniqueVisitors)
                      : "-"
                  }
                  iconColor="text-purple-600 bg-purple-50"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Sessões"
                  value={
                    latestAnalytics
                      ? formatNumber(latestAnalytics.sessions)
                      : "-"
                  }
                  iconColor="text-emerald-600 bg-emerald-50"
                />
                <StatCard
                  icon={ExternalLink}
                  label="Taxa de Rejeição"
                  value={
                    latestAnalytics
                      ? `${latestAnalytics.bounceRate.toFixed(1)}%`
                      : "-"
                  }
                  iconColor="text-amber-600 bg-amber-50"
                />
              </div>

              <div className="flex justify-between items-center border-t border-brand-terciar/10 pt-4">
                <h3 className="text-sm font-bold text-brand-extra1">Histórico de Acessos</h3>
                {userLevel <= 2 && (
                  <button
                    onClick={() => setShowAddAnalyticsModal(true)}
                    aria-haspopup="dialog"
                    aria-expanded={showAddAnalyticsModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secundar text-white rounded-lg text-xs font-medium hover:bg-brand-secundar/90 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Acessos
                  </button>
                )}
              </div>

              {businessUnit.analytics.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-brand-terciar/60 uppercase tracking-wider border-b border-brand-terciar/10">
                        <th className="pb-2 font-mono">Data</th>
                        <th className="pb-2 font-mono text-right">Page Views</th>
                        <th className="pb-2 font-mono text-right">Visitantes</th>
                        <th className="pb-2 font-mono text-right">Sessões</th>
                        <th className="pb-2 font-mono text-right">Rejeição</th>
                        <th className="pb-2 font-mono text-right">Duração Média</th>
                        {userLevel <= 2 && <th className="pb-2 font-mono text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {businessUnit.analytics.slice(0, 10).map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-brand-terciar/10 hover:bg-brand-principal/30"
                        >
                          <td className="py-2 text-brand-terciar">
                            {formatDate(a.date)}
                          </td>
                          <td className="py-2 text-right text-brand-extra1 font-medium">
                            {formatNumber(a.pageViews)}
                          </td>
                          <td className="py-2 text-right text-brand-terciar">
                            {formatNumber(a.uniqueVisitors)}
                          </td>
                          <td className="py-2 text-right text-brand-terciar">
                            {formatNumber(a.sessions)}
                          </td>
                          <td className="py-2 text-right text-brand-terciar">
                            {a.bounceRate.toFixed(1)}%
                          </td>
                          <td className="py-2 text-right text-brand-terciar">
                            {Math.floor(a.avgSessionDuration / 60)}m {a.avgSessionDuration % 60}s
                          </td>
                          {userLevel <= 2 && (
                            <td className="py-2 text-right">
                              <button
                                onClick={() => handleDeleteItem("analytics", a.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Remover registro"
                                aria-label={`Remover registro de analytics de ${formatDate(a.date)}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === "revenue" && (
            <div role="tabpanel" id="revenue-panel" aria-labelledby="revenue-tab" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon={DollarSign}
                  label="Último Período"
                  value={
                    latestRevenue ? formatCurrency(latestRevenue.amount) : "-"
                  }
                  iconColor="text-amber-600 bg-amber-50"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Tipo"
                  value={latestRevenue ? latestRevenue.type : "-"}
                  iconColor="text-blue-600 bg-blue-50"
                />
                <StatCard
                  icon={Settings}
                  label="Fonte"
                  value={latestRevenue ? latestRevenue.source : "-"}
                  iconColor="text-emerald-600 bg-emerald-50"
                />
              </div>

              <div className="flex justify-between items-center border-t border-brand-terciar/10 pt-4">
                <h3 className="text-sm font-bold text-brand-extra1">Histórico de Faturamento</h3>
                {userLevel <= 2 && (
                  <button
                    onClick={() => setShowAddRevenueModal(true)}
                    aria-haspopup="dialog"
                    aria-expanded={showAddRevenueModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secundar text-white rounded-lg text-xs font-medium hover:bg-brand-secundar/90 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Faturamento
                  </button>
                )}
              </div>

              {businessUnit.revenueData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-brand-terciar/60 uppercase tracking-wider border-b border-brand-terciar/10">
                        <th className="pb-2 font-mono">Período</th>
                        <th className="pb-2 font-mono text-right">Valor</th>
                        <th className="pb-2 font-mono text-right">Tipo</th>
                        <th className="pb-2 font-mono text-right">Fonte</th>
                        <th className="pb-2">Observações</th>
                        {userLevel <= 2 && <th className="pb-2 font-mono text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {businessUnit.revenueData.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-brand-terciar/10 hover:bg-brand-principal/30"
                        >
                          <td className="py-2 text-brand-terciar font-mono">
                            {r.period}
                          </td>
                          <td className="py-2 text-right text-brand-extra1 font-bold">
                            {formatCurrency(r.amount)}
                          </td>
                          <td className="py-2 text-right text-brand-terciar capitalize">
                            {r.type}
                          </td>
                          <td className="py-2 text-right text-brand-terciar">
                            {r.source}
                          </td>
                          <td className="py-2 text-brand-terciar/70 text-xs">
                            {r.notes || "-"}
                          </td>
                          {userLevel <= 2 && (
                            <td className="py-2 text-right">
                              <button
                                onClick={() => handleDeleteItem("revenue", r.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Remover faturamento"
                                aria-label={`Remover faturamento de ${r.period}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal de Sincronização */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-brand-terciar/10 p-6 shadow-xl relative overflow-hidden transform-gpu"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-brand-principal/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-brand-secundar animate-spin" />
                </div>
                
                <div className="space-y-1 w-full">
                  <h3 className="text-sm font-bold text-brand-extra1">
                    Sincronizando Dados
                  </h3>
                  <p className="text-xs text-brand-terciar/70 min-h-[32px] flex items-center justify-center px-2">
                    {syncSteps[syncStep]}
                  </p>
                </div>

                <div className="w-full h-1.5 bg-brand-principal/20 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-brand-secundar absolute left-0 top-0 transform-gpu"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((syncStep + 1) / syncSteps.length) * 100}%` }}
                    transition={{ ease: "linear", duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Edição */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onMouseDown={() => setShowEditModal(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowEditModal(false);
                editModalTriggerRef.current?.focus();
              }
            }}
          >
            <FocusLock returnFocus>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col transform-gpu"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Editar Unidade de Negócio
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  aria-label="Fechar modal de edicao"
                  className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 hover:text-brand-terciar transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(new FormData(e.currentTarget));
                }}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Nome *
                    </label>
                    <input
                      name="name"
                      required
                      defaultValue={businessUnit.name}
                      placeholder="Ex: Borgo del Vino"
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
                      defaultValue={businessUnit.slug}
                      placeholder="Ex: borgo-del-vino"
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
                      defaultValue={businessUnit.company}
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="BORGO">Borgo del Vin</option>
                      <option value="MAPLE_BEAR">Maple Bear</option>
                      <option value="AZUL">Azul Incorporações</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={businessUnit.description}
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
                        defaultValue={businessUnit.phone}
                        placeholder="(24) 2232-0000"
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
                        defaultValue={businessUnit.email}
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
                        defaultValue={businessUnit.address}
                        placeholder="Cidade, RJ"
                        className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                        Website
                      </label>
                      <input
                        name="website"
                        defaultValue={businessUnit.website}
                        placeholder="https://empresa.com"
                        className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Cover Image Upload */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                        Imagem de Capa
                      </label>
                      <input type="hidden" name="coverImage" value={coverUrl} />
                      
                      {uploadingCover ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-terciar/20 rounded-xl p-3 bg-brand-principal/10 h-24">
                          <RefreshCw className="w-5 h-5 text-brand-secundar animate-spin mb-1" />
                          <span className="text-[10px] text-brand-terciar/60">Enviando...</span>
                        </div>
                      ) : coverUrl ? (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-brand-terciar/10">
                          <img
                            src={coverUrl}
                            alt="Capa preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setCoverUrl("")}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-terciar/20 hover:border-brand-secundar rounded-xl p-3 bg-brand-principal/10 hover:bg-brand-principal/20 transition-all cursor-pointer text-center relative h-24">
                          <Upload className="w-5 h-5 text-brand-terciar/40 mb-1" />
                          <span className="text-[10px] text-brand-terciar/60">Arraste ou clique</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingCover(true);
                              const fd = new FormData();
                              fd.append("file", file);
                              try {
                                const res = await fetch("/api/upload/image", {
                                  method: "POST",
                                  body: fd,
                                  headers: { "X-CSRF-Token": getCsrfToken() }
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setCoverUrl(data.imageUrl);
                                } else {
                                  const err = await res.json();
                                  alert(err.error || "Erro no upload");
                                }
                              } catch {
                                alert("Erro de conexão");
                              } finally {
                                setUploadingCover(false);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                        Logo da Unidade
                      </label>
                      <input type="hidden" name="logo" value={logoUrl} />

                      {uploadingLogo ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-terciar/20 rounded-xl p-3 bg-brand-principal/10 h-24">
                          <RefreshCw className="w-5 h-5 text-brand-secundar animate-spin mb-1" />
                          <span className="text-[10px] text-brand-terciar/60">Enviando...</span>
                        </div>
                      ) : logoUrl ? (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-brand-terciar/10 flex items-center justify-center bg-brand-principal/20">
                          <img
                            src={logoUrl}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain p-2"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-terciar/20 hover:border-brand-secundar rounded-xl p-3 bg-brand-principal/10 hover:bg-brand-principal/20 transition-all cursor-pointer text-center relative h-24">
                          <Upload className="w-5 h-5 text-brand-terciar/40 mb-1" />
                          <span className="text-[10px] text-brand-terciar/60">Arraste ou clique</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingLogo(true);
                              const fd = new FormData();
                              fd.append("file", file);
                              try {
                                const res = await fetch("/api/upload/image", {
                                  method: "POST",
                                  body: fd,
                                  headers: { "X-CSRF-Token": getCsrfToken() }
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setLogoUrl(data.imageUrl);
                                } else {
                                  const err = await res.json();
                                  alert(err.error || "Erro no upload");
                                }
                              } catch {
                                alert("Erro de conexão");
                              } finally {
                                setUploadingLogo(false);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-brand-terciar/10">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:text-brand-extra1 hover:bg-brand-principal/50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
            </FocusLock>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Adicionar Ferramenta */}
      <AnimatePresence>
        {showAddToolModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onMouseDown={() => setShowAddToolModal(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowAddToolModal(false);
                addToolTriggerRef.current?.focus();
              }
            }}
          >
            <FocusLock returnFocus>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "tween", duration: 0.2 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col transform-gpu"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                  <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Ferramenta
                </h2>
                <button onClick={() => setShowAddToolModal(false)} aria-label="Fechar modal de ferramenta" className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const success = await handleAddItem("tool", {
                    name: fd.get("name"),
                    url: fd.get("url"),
                    category: fd.get("category"),
                    description: fd.get("description"),
                    isActive: true,
                    isExternal: true,
                    order: 0,
                  });
                  if (success) {
                    setShowAddToolModal(false);
                    form.reset();
                  }
                }}
                className="p-4 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome *</label>
                  <input name="name" required placeholder="Ex: CRM Vendas" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">URL *</label>
                  <input name="url" required placeholder="https://..." className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Categoria *</label>
                  <select name="category" required className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer">
                    <option value="CRM">CRM</option>
                    <option value="ERP">ERP</option>
                    <option value="Analytics">Analytics</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Descrição</label>
                  <textarea name="description" rows={2} placeholder="Descreva brevemente..." className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors resize-none" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-brand-terciar/10">
                  <button type="button" onClick={() => setShowAddToolModal(false)} className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs shadow-sm">Adicionar</button>
                </div>
              </form>
              </motion.div>
            </FocusLock>
          </motion.div>
        )}

        {editingTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onMouseDown={() => setEditingTool(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditingTool(null);
              }
            }}
          >
            <FocusLock returnFocus>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "tween", duration: 0.2 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col transform-gpu"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                  <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    Editar Ferramenta
                  </h2>
                  <button onClick={() => setEditingTool(null)} aria-label="Fechar modal de ferramenta" className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    const success = await handleEditItem("tool", editingTool.id, {
                      name: fd.get("name"),
                      url: fd.get("url"),
                      category: fd.get("category"),
                      description: fd.get("description"),
                      icon: editingTool.icon || "Building2",
                    });
                    if (success) {
                      setEditingTool(null);
                    }
                  }}
                  className="p-4 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome *</label>
                    <input name="name" required defaultValue={editingTool.name} placeholder="Ex: CRM Vendas" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">URL *</label>
                    <input name="url" required defaultValue={editingTool.url} placeholder="https://..." className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Categoria *</label>
                    <select name="category" required defaultValue={editingTool.category} className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer">
                      <option value="CRM">CRM</option>
                      <option value="ERP">ERP</option>
                      <option value="Analytics">Analytics</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Descrição</label>
                    <textarea name="description" rows={2} defaultValue={editingTool.description || ""} placeholder="Descreva brevemente..." className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors resize-none" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-brand-terciar/10">
                    <button type="button" onClick={() => setEditingTool(null)} className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs shadow-sm">Salvar Alterações</button>
                  </div>
                </form>
              </motion.div>
            </FocusLock>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Vincular Rede Social */}
      <AnimatePresence>
        {showAddSocialModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onMouseDown={() => setShowAddSocialModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col transform-gpu"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Vincular Rede Social
                </h2>
                <button onClick={() => setShowAddSocialModal(false)} aria-label="Fechar modal de rede social" className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const success = await handleAddItem("social", {
                    platform: fd.get("platform"),
                    url: fd.get("url"),
                    handle: fd.get("handle"),
                    followersCount: parseInt(fd.get("followersCount") as string, 10) || 0,
                    isActive: true,
                  });
                  if (success) {
                    setShowAddSocialModal(false);
                    form.reset();
                  }
                }}
                className="p-4 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Plataforma *</label>
                  <select name="platform" required className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer">
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">URL do Perfil *</label>
                  <input name="url" required placeholder="https://instagram.com/..." className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Handle/Username *</label>
                  <input name="handle" required placeholder="Ex: borgodelvino" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Seguidores / Inscritos *</label>
                  <input name="followersCount" type="number" required placeholder="Ex: 12500" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-brand-terciar/10">
                  <button type="button" onClick={() => setShowAddSocialModal(false)} className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs shadow-sm">Vincular</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Registrar Acessos */}
      <AnimatePresence>
        {showAddAnalyticsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onMouseDown={() => setShowAddAnalyticsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col transform-gpu"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Registrar Acessos (Google Analytics)
                </h2>
                <button onClick={() => setShowAddAnalyticsModal(false)} aria-label="Fechar modal de acessos" className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const success = await handleAddItem("analytics", {
                    date: fd.get("date"),
                    pageViews: parseInt(fd.get("pageViews") as string, 10) || 0,
                    uniqueVisitors: parseInt(fd.get("uniqueVisitors") as string, 10) || 0,
                    sessions: parseInt(fd.get("sessions") as string, 10) || 0,
                    bounceRate: parseFloat(fd.get("bounceRate") as string) || 0,
                    avgSessionDuration: parseInt(fd.get("avgSessionDuration") as string, 10) || 0,
                    source: "google_analytics",
                  });
                  if (success) {
                    setShowAddAnalyticsModal(false);
                    form.reset();
                  }
                }}
                className="p-4 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Data *</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().substring(0, 10)} className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Page Views *</label>
                    <input name="pageViews" type="number" required placeholder="Ex: 3500" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Visitantes Únicos *</label>
                    <input name="uniqueVisitors" type="number" required placeholder="Ex: 2400" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Sessões *</label>
                    <input name="sessions" type="number" required placeholder="2600" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Rejeição (%) *</label>
                    <input name="bounceRate" type="number" step="0.1" required placeholder="42.5" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Duração (segundos) *</label>
                    <input name="avgSessionDuration" type="number" required placeholder="180" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-brand-terciar/10">
                  <button type="button" onClick={() => setShowAddAnalyticsModal(false)} className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs shadow-sm">Registrar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Registrar Faturamento */}
      <AnimatePresence>
        {showAddRevenueModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onMouseDown={() => setShowAddRevenueModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col transform-gpu"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Registrar Faturamento
                </h2>
                <button onClick={() => setShowAddRevenueModal(false)} aria-label="Fechar modal de faturamento" className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const success = await handleAddItem("revenue", {
                    period: fd.get("period"),
                    amount: parseFloat(fd.get("amount") as string) || 0,
                    currency: "BRL",
                    type: fd.get("type"),
                    source: fd.get("source"),
                    notes: fd.get("notes"),
                  });
                  if (success) {
                    setShowAddRevenueModal(false);
                    form.reset();
                  }
                }}
                className="p-4 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Período (AAAA-MM ou AAAA) *</label>
                    <input name="period" required placeholder="Ex: 2026-06" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Valor (BRL) *</label>
                    <input name="amount" type="number" required placeholder="Ex: 150000" className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Tipo *</label>
                    <select name="type" required className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer">
                      <option value="gross">Bruto (Gross)</option>
                      <option value="net">Líquido (Net)</option>
                      <option value="projected">Projetado (Projected)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Fonte *</label>
                    <select name="source" required className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer">
                      <option value="manual">Manual</option>
                      <option value="erp">ERP Integrado</option>
                      <option value="api">API de Faturamento</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Observações</label>
                  <textarea name="notes" rows={2} placeholder="Notas adicionais..." className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors resize-none" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-brand-terciar/10">
                  <button type="button" onClick={() => setShowAddRevenueModal(false)} className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs shadow-sm">Registrar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Components
function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  iconColor: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-brand-terciar/10 bg-white">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-brand-extra1">{value}</p>
        <p className="text-[10px] text-brand-terciar/60 uppercase tracking-wider font-mono">
          {label}
        </p>
      </div>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-principal/30 border border-brand-terciar/10">
      <div className="p-2 rounded-lg bg-white border border-brand-terciar/10 text-brand-secundar">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] text-brand-terciar/60 uppercase tracking-wider font-mono">
          {label}
        </p>
        <p className="text-sm text-brand-extra1 font-medium">{value}</p>
      </div>
    </div>
  );
}

function ToolCard({ tool, onEdit, onDelete }: { tool: BusinessUnitTool; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className={`relative group/tool ${onEdit ? "pr-20" : "pr-10"}`}>
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-lg border border-brand-terciar/10 bg-white hover:bg-brand-principal/30 transition-colors"
      >
        <div className="p-2 rounded-lg bg-brand-principal/30 border border-brand-terciar/10 text-brand-secundar">
          <ExternalLink className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-extra1 truncate">
            {tool.name}
          </p>
          <p className="text-xs text-brand-terciar/60 truncate">
            {tool.description || tool.category}
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-brand-terciar/10 text-brand-terciar/70 font-mono uppercase mr-4">
          {tool.category}
        </span>
        <ExternalLink className="w-4 h-4 text-brand-terciar/40" />
      </a>
      {onEdit && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className="absolute right-10 top-1/2 -translate-y-1/2 p-2 text-brand-secundar hover:bg-brand-principal/50 rounded-lg opacity-0 group-hover/tool:opacity-100 transition-opacity"
          title="Editar ferramenta"
          aria-label={`Editar ferramenta ${tool.name}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/tool:opacity-100 transition-opacity"
          title="Remover ferramenta"
          aria-label={`Remover ferramenta ${tool.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function SocialCard({ social, onDelete }: { social: BusinessUnitSocialLink; onDelete?: () => void }) {
  const Icon = platformIcons[social.platform.toLowerCase()] || Globe;
  const platformColors: Record<string, string> = {
    instagram: "text-pink-600 bg-pink-50",
    facebook: "text-blue-600 bg-blue-50",
    linkedin: "text-blue-700 bg-blue-50",
    youtube: "text-red-600 bg-red-50",
    tiktok: "text-gray-900 bg-gray-100",
  };

  return (
    <div className="relative group/social pr-10">
      <a
        href={social.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-lg border border-brand-terciar/10 bg-white hover:bg-brand-principal/30 transition-colors"
      >
        <div
          className={`p-2 rounded-lg ${platformColors[social.platform.toLowerCase()] || "text-brand-terciar bg-brand-principal/30"}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-brand-extra1 capitalize">
              {social.platform}
            </p>
            {social.handle && (
              <span className="text-xs text-brand-terciar/60">
                @{social.handle}
              </span>
            )}
          </div>
          <p className="text-xs text-brand-terciar/60 truncate">{social.url}</p>
        </div>
        <div className="text-right mr-4">
          <p className="text-sm font-bold text-brand-extra1">
            {formatNumber(social.followersCount)}
          </p>
          <p className="text-[10px] text-brand-terciar/60">seguidores</p>
        </div>
        <ExternalLink className="w-4 h-4 text-brand-terciar/40" />
      </a>
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/social:opacity-100 transition-opacity"
          title="Remover rede social"
          aria-label={`Remover rede social ${social.platform}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
