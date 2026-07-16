"use client";

import { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Link as LinkIcon,
  RotateCcw,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva o comunicado detalhadamente...",
  error = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sanitize HTML on input to prevent XSS
  const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "b",
        "strong",
        "i",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "ul",
        "ol",
        "li",
        "a",
        "span",
        "div",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
      ALLOW_DATA_ATTR: false,
    });
  };

  // Sincronizar o valor inicial do editor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Sanitize the incoming value before setting
      const sanitizedValue = sanitizeHtml(value || "");
      editorRef.current.innerHTML = sanitizedValue;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Sanitize before sending to parent
      const sanitizedHtml = sanitizeHtml(html);

      // Se estiver vazio (ex: <p><br></p> ou apenas espaços), envia string vazia
      if (
        sanitizedHtml === "<p><br></p>" ||
        sanitizedHtml === "<br>" ||
        editorRef.current.innerText.trim() === ""
      ) {
        onChange("");
      } else {
        onChange(sanitizedHtml);
      }
    }
  };

  const executeCommand = (command: string, value: string = "") => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, value);
      handleInput();
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  };

  const handleAddLink = () => {
    if (typeof window !== "undefined") {
      const url = window.prompt("Insira a URL do link (ex: https://google.com):");
      if (url) {
        // Validação básica de url
        const formattedUrl =
          url.startsWith("http://") || url.startsWith("https://")
            ? url
            : `https://${url}`;
        executeCommand("createLink", formattedUrl);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Atalhos comuns: Ctrl+B (Negrito), Ctrl+I (Itálico)
    if (e.ctrlKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        executeCommand("bold");
      }
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        executeCommand("italic");
      }
    }
  };

  return (
    <div
      className={`w-full border rounded-xl overflow-hidden bg-brand-principal/20 transition-all duration-200 ${
        isFocused
          ? "border-brand-secundar ring-1 ring-brand-secundar bg-white"
          : error
            ? "border-red-500 bg-red-50/10"
            : "border-brand-terciar/15 hover:border-brand-terciar/30"
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-brand-principal/40 border-b border-brand-terciar/10 flex-wrap">
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          title="Negrito (Ctrl+B)"
          className="p-1.5 rounded-lg text-brand-terciar hover:bg-brand-principal hover:text-brand-secundar transition-colors transform-gpu"
          aria-label="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("italic")}
          title="Itálico (Ctrl+I)"
          className="p-1.5 rounded-lg text-brand-terciar hover:bg-brand-principal hover:text-brand-secundar transition-colors transform-gpu"
          aria-label="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-brand-terciar/15 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<h1>")}
          title="Título Grande"
          className="p-1.5 rounded-lg text-brand-terciar hover:bg-brand-principal hover:text-brand-secundar transition-colors transform-gpu"
          aria-label="Título grande"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "<h2>")}
          title="Título Médio"
          className="p-1.5 rounded-lg text-brand-terciar hover:bg-brand-principal hover:text-brand-secundar transition-colors transform-gpu"
          aria-label="Título médio"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-brand-terciar/15 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          title="Lista com Marcadores"
          className="p-1.5 rounded-lg text-brand-terciar hover:bg-brand-principal hover:text-brand-secundar transition-colors transform-gpu"
          aria-label="Lista com marcadores"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("insertOrderedList")}
          title="Lista Numerada"
          className="p-1.5 rounded-lg text-brand-terciar hover:bg-brand-principal hover:text-brand-secundar transition-colors transform-gpu"
          aria-label="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-brand-terciar/15 mx-1" />

        <button
          type="button"
          onClick={handleAddLink}
          title="Inserir Link"
          className="p-1.5 rounded-lg text-brand-terciar hover:bg-brand-principal hover:text-brand-secundar transition-colors transform-gpu"
          aria-label="Inserir link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("removeFormat")}
          title="Limpar Formatação"
          className="p-1.5 rounded-lg text-brand-terciar hover:bg-brand-principal hover:text-brand-secundar transition-colors transform-gpu"
          aria-label="Limpar formatação"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[160px] max-h-[300px] overflow-y-auto px-4 py-3 text-xs text-brand-terciar focus:outline-none prose prose-sm max-w-none focus:bg-white transition-colors"
        style={{ outline: "none" }}
        role="textbox"
        aria-multiline="true"
        aria-label="Editor de texto rico"
        data-placeholder={placeholder}
      />

      {/* Placeholder fallback using CSS/JS */}
      {(!value || value === "<p><br></p>" || value === "<br>") && !isFocused && (
        <div
          onClick={() => editorRef.current?.focus()}
          className="absolute mt-[-150px] ml-4 text-xs text-brand-terciar/45 pointer-events-none font-sans"
          aria-hidden="true"
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}
