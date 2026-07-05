"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

/* ============================================================
   MESSAGE BOX
   ------------------------------------------------------------
   Caixa de mensagem reutilizavel com variantes de tipo,
   botao de fechar e acao opcional.
   ============================================================ */
export type MessageBoxType = "success" | "error" | "warning" | "info";

export interface MessageBoxProps {
  title?: string;
  message: string;
  type?: MessageBoxType;
  onClose?: () => void;
  action?: ReactNode;
  className?: string;
}

const typeConfig: Record<
  MessageBoxType,
  { icon: typeof CheckCircle; colors: string }
> = {
  success: {
    icon: CheckCircle,
    colors:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  error: {
    icon: AlertCircle,
    colors: "border-red-200 bg-red-50 text-red-800",
  },
  warning: {
    icon: AlertTriangle,
    colors: "border-amber-200 bg-amber-50 text-amber-800",
  },
  info: {
    icon: Info,
    colors: "border-blue-200 bg-blue-50 text-blue-800",
  },
};

export function MessageBox({
  title,
  message,
  type = "info",
  onClose,
  action,
  className = "",
}: MessageBoxProps) {
  const { icon: Icon, colors } = typeConfig[type];
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={`p-3 rounded-lg text-xs border ${colors} ${className}`}
        >
          <div className="flex items-start gap-2">
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {title && (
                <p className="font-semibold mb-0.5">{title}</p>
              )}
              <p className="leading-relaxed">{message}</p>
              {action && <div className="mt-2">{action}</div>}
            </div>
            {onClose && (
              <button
                onClick={handleClose}
                className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

