"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { ComponentType, ReactNode } from "react";

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "tween", duration: 0.2, ease: "easeInOut" },
  },
};

/* ============================================================
   STAT CARD
   ------------------------------------------------------------
   Suporta duas assinaturas:
   1. Dashboard Home (horizontal): icon=ReactNode, title,
      value (number), subtitle, colorClass, animated=true
   2. Unidades (vertical): icon=ComponentType, label, value
      (string), iconColor, animated=false
   ============================================================ */
export interface StatCardProps {
  /** Titulo do card (modo dashboard horizontal) */
  title?: string;
  /** Rotulo do card (modo unidades vertical) */
  label?: string;
  /** Valor principal - pode ser number ou string */
  value: number | string;
  /** Subtitulo extra (modo dashboard horizontal) */
  subtitle?: string;
  /** Icone como ReactNode (modo dashboard - JSX element) */
  icon?: ReactNode;
  /** Icone como ComponentType (modo unidades - componente) */
  iconComponent?: ComponentType<{ className?: string }>;
  /** Classe de cor do container do icone (modo dashboard) */
  colorClass?: string;
  /** Classe de cor do icone (modo unidades - text+bg) */
  iconColor?: string;
  /** Habilita animacao motion (default: true quando title existe) */
  animated?: boolean;
  /** Variants customizadas para o motion.div */
  motionVariants?: Variants;
  /** Classe extra opcional */
  className?: string;
}

export function StatCard({
  title,
  label,
  value,
  subtitle,
  icon,
  iconComponent,
  colorClass,
  iconColor,
  animated,
  motionVariants,
  className = "",
}: StatCardProps) {
  // Modo dashboard horizontal: usa title + icon (ReactNode) + motion
  const isDashboardMode = title !== undefined;
  const shouldAnimate = animated ?? isDashboardMode;

  /* ---- Modo Dashboard (horizontal, animado) ---- */
  if (isDashboardMode) {
    const MotionTag = shouldAnimate ? motion.div : "div";
    const motionProps = shouldAnimate
      ? { variants: motionVariants ?? itemVariants }
      : {};
    return (
      <MotionTag
        {...motionProps}
        className={`p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm hover:shadow-md transition-shadow ${className}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-medium text-brand-terciar/60 uppercase tracking-wider block">
              {title}
            </span>
            <p className="text-2xl font-bold text-brand-extra1 mt-1 tabular-nums">
              {value}
            </p>
            {subtitle && (
              <p className="text-[11px] text-brand-terciar/50 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={`p-2 rounded-lg ${colorClass ?? ""}`}>{icon}</div>
          )}
        </div>
      </MotionTag>
    );
  }

  /* ---- Modo Unidades (vertical, sem motion por padrao) ---- */
  const MotionTag = shouldAnimate ? motion.div : "div";
  const motionProps = shouldAnimate
    ? { variants: motionVariants ?? itemVariants }
    : {};
  const IconComp = iconComponent;
  return (
    <MotionTag
      {...motionProps}
      className={`p-4 rounded-xl border border-brand-terciar/10 bg-white ${className}`}
    >
      <div className="flex items-center justify-between">
        {IconComp && (
          <div className={`p-2 rounded-lg ${iconColor ?? ""}`}>
            <IconComp className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-brand-extra1">{value}</p>
        {label && (
          <p className="text-[10px] text-brand-terciar/60 uppercase tracking-wider font-mono">
            {label}
          </p>
        )}
      </div>
    </MotionTag>
  );
}

