"use client";

import { useState, useCallback, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { useCompanies } from "@/hooks/useCompanies";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  Search, 
  Plus, 
  X, 
  Eye, 
  Download, 
  User, 
  Info,
  Video,
  Link as LinkIcon,
  FileSpreadsheet,
  ExternalLink,
  Image as ImageIcon,
  Folder
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: string;
  minHierarchyLevel: number;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

interface DocumentosClientProps {
  documents: DocumentItem[];
  isUploadAllowed: boolean;
  userLevel: number;
}

interface DocumentType {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export default function DocumentosClient({
  documents: initialDocuments,
  isUploadAllowed,
  userLevel,
}: DocumentosClientProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const { companies } = useCompanies();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);
  
  // Form state
  const [isExternal, setIsExternal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CENTRAL");
  const [minLevel, setMinLevel] = useState("3");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [extFileType, setExtFileType] = useState("link");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);

  useEffect(() => {
    const fetchDocTypes = async () => {
      try {
        const res = await fetch("/api/document-types");
        if (res.ok) {
          const data = await res.json();
          setDocTypes(data);
        }
      } catch (err) {
        console.error("Erro ao buscar tipos de documentos:", err);
      }
    };
    fetchDocTypes();
  }, []);

  const reloadDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Erro ao recarregar documentos:", err);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check: if the hidden website_url field has any value, a bot filled it
    const honeypotForm = new FormData(e.currentTarget as HTMLFormElement);
    const honeypotValue = honeypotForm.get("website_url");
    if (honeypotValue && String(honeypotValue).trim() !== "") {
      console.warn("[SECURITY] Honeypot triggered on upload form - bot detected", {
        honeypotValue: String(honeypotValue).substring(0, 100),
      });
      setUploading(true);
      return;
    }

    if (isExternal && (!externalUrl || !title)) {
      setMessage({ type: "error", text: "Preencha o titulo e a URL do link" });
      return;
    }
    if (!isExternal && (!file || !title)) {
      setMessage({ type: "error", text: "Preencha o titulo e selecione um arquivo" });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("minHierarchyLevel", minLevel);
    formData.append("isExternal", String(isExternal));

    if (isExternal) {
      formData.append("externalUrl", externalUrl);
      formData.append("fileType", extFileType);
    } else {
      if (file) formData.append("file", file);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage({ 
          type: "success", 
          text: isExternal 
            ? "Link externo registrado com sucesso no drive" 
            : "Documento enviado com sucesso para o drive" 
        });
        setTitle("");
        setDescription("");
        setCategory("CENTRAL");
        setMinLevel("3");
        setFile(null);
        setExternalUrl("");
        setExtFileType("link");
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        await reloadDocuments();
        setUploadOpen(false);
      } else {
        const errData = await res.json();
        setMessage({ type: "error", text: errData.error || "Erro no envio do documento" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro na conexao com o servidor" });
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) || 
                          (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = activeFilter === "ALL" || doc.category === activeFilter;
    const isLevelVisible = userLevel <= doc.minHierarchyLevel;
    return matchesSearch && matchesFilter && isLevelVisible;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "Link Externo";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getCompanyBadgeColor = (cat: string) => {
    const comp = companies.find((c) => c.slug === cat);
    const color = comp?.color || "GOLD";
    switch (color) {
      case "WINE": return "text-brand-terciar border-brand-terciar/20 bg-brand-terciar/10";
      case "RED": return "text-brand-secundar border-brand-secundar/20 bg-brand-secundar/10";
      case "AZUL": return "text-brand-extra2 border-brand-extra2/20 bg-brand-extra2/10";
      default: return "text-brand-extra1 border-brand-secundar/20 bg-brand-principal";
    }
  };

  // Get matching icon based on file type
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    const matchedType = docTypes.find(t => 
      t.name.toLowerCase() === type ||
      type.includes(t.name.toLowerCase())
    );
    if (matchedType) {
      const IconComp = (LucideIcons[matchedType.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>) || LucideIcons.FileText;
      return <IconComp className="w-5 h-5 text-brand-extra2" />;
    }

    if (type.includes("video") || type === "video") return <Video className="w-5 h-5 text-brand-extra2" />;
    if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv") || type.includes("sheet")) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (type.includes("image") || type === "image") return <ImageIcon className="w-5 h-5 text-indigo-500" />;
    if (type === "sharepoint" || type === "drive") return <Folder className="w-5 h-5 text-amber-500" />;
    if (type === "link") return <LinkIcon className="w-5 h-5 text-brand-secundar" />;
    return <FileText className="w-5 h-5 text-brand-extra2" />;
  };

  return (
    <PageWrapper title="Drive de Arquivos & Midias">
      <div className="space-y-6 text-brand-terciar">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
            Drive de Arquivos & Midias
          </h1>
          <p className="text-xs text-brand-terciar/70 mt-1">
            Armazenamento integrado para documentos, contratos, apresentacoes e midias publicas ou internas.
          </p>
        </div>
        
        {isUploadAllowed && (
          <button
            onClick={() => setUploadOpen(!uploadOpen)}
            className="flex items-center justify-center gap-1.5 self-start sm:self-center px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors cursor-pointer"
          >
            {uploadOpen ? (
              <>
                <X className="w-3.5 h-3.5" />
                Fechar Painel
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Adicionar Item
              </>
            )}
          </button>
        )}
      </div>

      {/* Storage Information Notice */}
      <div className="p-4 rounded-xl border border-brand-secundar/20 bg-white shadow-sm flex gap-3 text-xs text-brand-terciar">
        <Info className="w-4 h-4 text-brand-secundar shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-brand-extra1">Importante sobre o armazenamento</p>
          <p className="leading-relaxed">
            Arquivos grandes, videos ou documentos pesados devem ser vinculados obrigatoriamente via <strong>link externo</strong> (utilizando servicos como Google Drive, SharePoint ou YouTube). O espaco para upload direto de arquivos locais e limitado e nao pode ultrapassar o limite maximo de 10 GB no total.
          </p>
        </div>
      </div>

      {/* Upload/Register Form Block */}
      <AnimatePresence>
        {uploadOpen && isUploadAllowed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={handleUploadSubmit}
              className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-md space-y-4 mb-6"
            >
              <h2 className="text-xs font-mono uppercase text-brand-extra2 font-bold flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Adicionar Novo Arquivo ou Link
              </h2>

              {/* Tab Selector */}
              <div className="flex border-b border-brand-terciar/10 pb-1 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsExternal(false)}
                  className={`pb-2 transition-all cursor-pointer ${!isExternal ? "border-b-2 border-brand-secundar text-brand-secundar font-bold" : "text-brand-terciar/50 hover:text-brand-terciar"}`}
                >
                  Upload de Arquivos (Max 10 GB no total)
                </button>
                <button
                  type="button"
                  onClick={() => setIsExternal(true)}
                  className={`pb-2 transition-all cursor-pointer ${isExternal ? "border-b-2 border-brand-secundar text-brand-secundar font-bold" : "text-brand-terciar/50 hover:text-brand-terciar"}`}
                >
                  Vincular Link Externo (Drive/SharePoint/Videos)
                </button>
              </div>

              {/* Alert notice about large files and local limit */}
              <div className="p-3 bg-brand-principal/20 border border-brand-terciar/10 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-brand-extra1 uppercase tracking-wider">Aviso Importante</p>
                <p className="text-[10px] text-brand-terciar/70 leading-relaxed">
                  Arquivos grandes, videos ou midias pesadas devem ser vinculados via links externos (ex: Google Drive, SharePoint e YouTube) para poupar espaco. O limite maximo para uploads locais e de 10 GB.
                </p>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-xs border ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}>
                  {message.text}
                </div>
              )}

              {/* Honeypot field - hidden from humans, filled by bots */}
              <input
                type="text"
                name="website_url"
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Titulo</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Treinamento de Vendas Borgo del Vin"
                    className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Descricao</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve resumo ou informacoes do item"
                    className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Empresa / Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                  >
                    {companies.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {userLevel === 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nivel Minimo de Acesso</label>
                    <select
                      value={minLevel}
                      onChange={(e) => setMinLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="3">Nivel 3 (Operacional / Qualquer Colaborador)</option>
                      <option value="2">Nivel 2 (Gerencia / Coordenacao)</option>
                      <option value="1">Nivel 1 (Direcao Geral / Admin)</option>
                    </select>
                  </div>
                )}
              </div>

              {isExternal ? (
                /* External Link Inputs */
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">URL do Link Externo</label>
                    <input
                      type="url"
                      required
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://drive.google.com/... ou https://youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Tipo de Midia / Destino</label>
                    <select
                      value={extFileType}
                      onChange={(e) => setExtFileType(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="link">Link Externo Geral</option>
                      <option value="video">Video (YouTube/Vimeo/Stream)</option>
                      <option value="sharepoint">Google Drive / SharePoint / OneDrive</option>
                      <option value="application/pdf">PDF / Documento Remoto</option>
                      <option value="image">Imagem Pesada (CDN)</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Local File Upload Input */
                <div className="space-y-2">
                  <label className="text-[10px] text-brand-terciar/70 font-mono uppercase block">Arquivo Local</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-brand-terciar/25 rounded-xl bg-brand-principal/10 hover:bg-brand-principal/30 cursor-pointer transition-all">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <Upload className="w-5 h-5 text-brand-terciar/50 mb-1" />
                        <p className="text-[10px] text-brand-terciar/70">
                          {file ? (
                            <span className="font-semibold text-brand-extra1">{file.name}</span>
                          ) : (
                            "Selecione um arquivo de imagem, PDF ou planilha ate 20MB"
                          )}
                        </p>
                      </div>
                      <input
                        id="file-input"
                        type="file"
                        required={!isExternal}
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:text-brand-extra1 hover:bg-brand-principal/50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      {isExternal ? "Vincular Link no Drive" : "Enviar Arquivo"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search - Mobile First */}
      <div className="flex flex-col gap-4 py-2 border-y border-brand-terciar/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-terciar/50" />
          <input
            type="text"
            placeholder="Buscar arquivo ou link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-brand-terciar/10 rounded-xl text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none w-full sm:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "ALL"
                ? "bg-brand-secundar text-white border-brand-secundar shadow-sm"
                : "bg-white border-brand-terciar/10 text-brand-terciar/60 hover:text-brand-secundar hover:bg-brand-principal/20"
            }`}
          >
            Todos
          </button>
          {companies.map((comp) => (
            <button
              key={comp.slug}
              onClick={() => setActiveFilter(comp.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === comp.slug
                  ? "bg-brand-secundar text-white border-brand-secundar shadow-sm"
                  : "bg-white border-brand-terciar/10 text-brand-terciar/60 hover:text-brand-secundar hover:bg-brand-principal/20"
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Documents/Links List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-brand-terciar/20 bg-white rounded-2xl shadow-sm">
          <p className="text-sm text-brand-terciar/50">Nenhum documento ou link encontrado para esta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const isLink = doc.fileSize === 0;
            return (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={doc.id}
                className="flex flex-col justify-between p-4 rounded-xl border border-brand-terciar/10 bg-white hover:border-brand-secundar shadow-sm hover:shadow-md transition-all gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between w-full">
                    <span className={`text-[9px] font-bold border px-2 py-0.5 rounded ${getCompanyBadgeColor(doc.category)}`}>
                      {companies.find((c) => c.slug === doc.category)?.name || doc.category}
                    </span>
                    
                    <div className="flex gap-1.5 items-center">
                      {isLink && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          Link Externo
                        </span>
                      )}
                      <span className="text-[9px] font-mono font-bold text-brand-extra2 bg-brand-extra2/10 border border-brand-extra2/10 px-1.5 py-0.5 rounded">
                        Nivel {doc.minHierarchyLevel}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-brand-principal rounded-lg text-brand-extra1 self-start">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-brand-extra1 truncate">{doc.title}</h3>
                      <p className="text-[10px] text-brand-terciar/85 mt-1 line-clamp-2 leading-relaxed">
                        {doc.description || "Sem descricao fornecida."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer actions */}
                <div className="pt-3 border-t border-brand-terciar/10 flex items-center justify-between text-[10px] text-brand-terciar/60">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {doc.uploadedByName}
                    </span>
                    <span className="text-[9px] font-mono text-brand-terciar/50">
                      {formatBytes(doc.fileSize)} | {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {isLink ? (
                      /* Open link externally */
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/20 text-brand-secundar hover:text-brand-secundar/80 hover:bg-brand-principal/60 cursor-pointer flex items-center justify-center"
                        title="Abrir Link Externo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      /* Download file */
                      <>
                        <button
                          onClick={() => alert(`Visualizando arquivo: ${doc.title} (URL: ${doc.fileUrl})`)}
                          className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/20 text-brand-secundar hover:text-brand-secundar/80 hover:bg-brand-principal/60 cursor-pointer"
                          title="Visualizar arquivo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={doc.fileUrl}
                          download
                          className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/20 text-brand-secundar hover:text-brand-secundar/80 hover:bg-brand-principal/60 cursor-pointer"
                          title="Baixar arquivo"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Security notice block */}
      <div className="p-4 rounded-xl border border-brand-secundar/20 bg-brand-secundar/5 flex gap-3 text-xs text-brand-terciar">
        <Info className="w-4 h-4 text-brand-secundar shrink-0 self-start sm:self-center" />
        <p className="leading-relaxed">
          Os arquivos salvos localmente sao enviados ao armazenamento do drive. Links externos sao redirecionados de forma segura respeitando a hierarquia de cargos configurada no painel de seguranca.
        </p>
      </div>
    </div>
    </PageWrapper>
  );
}
