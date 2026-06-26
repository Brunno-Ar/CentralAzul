"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ExternalLink,
  FileText,
  Building2,
  User,
  Loader2,
  Command,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "quicklink" | "document" | "panel" | "user";
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  external?: boolean;
  fileType?: string;
  tags?: string[];
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  ExternalLink,
  FileText,
  Building2,
  User,
  Wine: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 22h8" />
      <path d="M12 11v11" />
      <path d="M8 11a4 4 0 0 1 0-8h8a4 4 0 0 1 0 8" />
      <path d="M8 11h8a4 4 0 0 0 0-8" />
    </svg>
  ),
  GraduationCap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a1 1 0 0 0 1.66 0z" />
      <path d="M22 10.92v6.08a2 2 0 0 1-2.17 1.95L12 18.95l-7.83 3.92A2 2 0 0 1 2 17V11" />
      <path d="M6 14.5V17" />
      <path d="M18 14.5V17" />
    </svg>
  ),
};

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focar input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
      // Carregar buscas recentes do localStorage
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTimeout(() => {
            setRecentSearches(parsed);
          }, 0);
        } catch {
          setTimeout(() => {
            setRecentSearches([]);
          }, 0);
        }
      }
    }
  }, [isOpen]);

  // Buscar com debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      const t = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(t);
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=8`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error("Erro na busca:", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    // Salvar no histórico
    const newRecent = [
      query,
      ...recentSearches.filter((s) => s !== query),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));

    // Registrar clique se for quicklink
    if (result.type === "quicklink") {
      fetch("/api/quicklinks/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quickLinkId: result.id }),
      }).catch(() => {});
    }

    if (result.external || result.url.startsWith("http")) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    } else {
      router.push(result.url);
    }
    onClose();
  };

  const handleClearQuery = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  const getIconComponent = (iconName: string) => {
    const Icon = iconMap[iconName] || ExternalLink;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "quicklink":
        return "Atalho";
      case "document":
        return "Documento";
      case "panel":
        return "Ferramenta";
      case "user":
        return "Colaborador";
      default:
        return "Resultado";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "BORGO":
        return "text-brand-terciar bg-brand-terciar/10";
      case "MAPLE_BEAR":
        return "text-brand-secundar bg-brand-secundar/10";
      case "AZUL":
        return "text-brand-extra2 bg-brand-extra2/10";
      default:
        return "text-brand-extra1 bg-brand-principal";
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      {/* Search Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Area */}
        <div className="p-4 border-b border-brand-terciar/10">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-terciar/40">
              <Search className="w-5 h-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar ferramentas, documentos, atalhos, pessoas..."
              className="w-full pl-12 pr-14 py-3 bg-brand-principal/30 border border-brand-terciar/15 rounded-xl text-sm text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={handleClearQuery}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 hover:text-brand-terciar transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Hint */}
          <div className="flex items-center justify-between mt-2 text-xs text-brand-terciar/50">
            <kbd className="px-2 py-0.5 bg-brand-principal/50 rounded font-mono">
              <Command className="w-3 h-3 inline-block align-middle mr-1" /> K
            </kbd>
            <kbd className="px-2 py-0.5 bg-brand-principal/50 rounded font-mono">
              ↑ ↓
            </kbd>
            <kbd className="px-2 py-0.5 bg-brand-principal/50 rounded font-mono">
              Enter
            </kbd>
            <kbd className="px-2 py-0.5 bg-brand-principal/50 rounded font-mono">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <Loader2 className="w-6 h-6 text-brand-secundar animate-spin mx-auto mb-2" />
              <p className="text-sm text-brand-terciar/60">Buscando...</p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-h-96 overflow-y-auto"
            >
              <div className="px-3 py-2 border-b border-brand-terciar/10">
                <p className="text-xs font-mono uppercase text-brand-terciar/50 tracking-wider">
                  {results.length} resultado{results.length !== 1 ? "s" : ""}{" "}
                  encontrado{results.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ul className="divide-y divide-brand-terciar/10">
                {results.map((result, index) => (
                  <motion.li
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? "bg-brand-principal/50"
                        : "hover:bg-brand-principal/30"
                    }`}
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${getCategoryColor(
                          result.category,
                        )}`}
                      >
                        {getIconComponent(result.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-brand-extra1 truncate block">
                            {result.title}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getCategoryColor(
                              result.category,
                            )}`}
                          >
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-sm text-brand-terciar/70 mt-1 truncate">
                          {result.description}
                        </p>
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 bg-brand-principal/50 rounded text-brand-terciar/70"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {result.external && (
                        <ExternalLink className="w-4 h-4 text-brand-terciar/40 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ) : query.length >= 2 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <Search className="w-10 h-10 text-brand-terciar/20 mx-auto mb-3" />
              <p className="text-sm text-brand-terciar/60">
                Nenhum resultado para &quot;{query}&quot;
              </p>
            </motion.div>
          ) : recentSearches.length > 0 ? (
            <motion.div
              key="recent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-h-64 overflow-y-auto"
            >
              <div className="px-3 py-2 border-b border-brand-terciar/10 flex items-center justify-between">
                <p className="text-xs font-mono uppercase text-brand-terciar/50 tracking-wider">
                  Buscas recentes
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem("recentSearches");
                    setRecentSearches([]);
                  }}
                  className="text-[10px] text-brand-terciar/50 hover:text-brand-terciar"
                >
                  Limpar
                </button>
              </div>
              <ul className="divide-y divide-brand-terciar/10">
                {recentSearches.map((search, index) => (
                  <motion.li
                    key={search}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="px-4 py-3 cursor-pointer hover:bg-brand-principal/30 transition-colors"
                    onClick={() => {
                      setQuery(search);
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-brand-terciar/40 shrink-0" />
                      <span className="text-sm text-brand-terciar/80">
                        {search}
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="empty-initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <Search className="w-10 h-10 text-brand-terciar/20 mx-auto mb-3" />
              <p className="text-sm text-brand-terciar/60">
                Digite para buscar atalhos, documentos, ferramentas e pessoas
              </p>
              <p className="text-xs text-brand-terciar/40 mt-2 font-mono">
                Mínimo 2 caracteres
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
