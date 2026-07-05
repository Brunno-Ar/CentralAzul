"use client";

import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes, forwardRef } from "react";

/* ============================================================
   BUTTON
   ============================================================ */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, icon, children, className, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2";
    
    const variants = {
      primary: "bg-brand-primary text-white hover:bg-brand-primary-light active:bg-brand-primary-dark active:scale-[0.98]",
      secondary: "bg-transparent text-brand-foreground border border-brand-foreground/15 hover:bg-brand-surface-alt hover:border-brand-foreground/25",
      ghost: "bg-transparent text-brand-foreground-muted hover:bg-brand-surface-alt hover:text-brand-foreground",
      danger: "bg-error text-white hover:bg-red-700 active:scale-[0.98]",
    };

    const sizes = {
      sm: "px-3celer py-1.5 text-xs",
      md: "px-4 py-2 text-[13px]",
      lg: "px-5 py-2.5 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/* ============================================================
   CARD
   ============================================================ */
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className, hover = true, padding = "md" }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-brand-surface border border-brand-foreground/8 rounded-xl shadow-sm transition-all duration-200",
        hover && "hover:shadow-md hover:border-brand-primary/15",
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

/* ============================================================
   BADGE
   ============================================================ */
interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "success" | "warning" | "error" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variants = {
    primary: "bg-info-light text-brand-primary",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    error: "bg-error-light text-error",
    neutral: "bg-brand-surface-alt text-brand-foreground-muted",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full whitespace-nowrap", variants[variant], className)}>
      {children}
    </span>
  );
}

/* ============================================================
   STAT CARD
   ============================================================ */
interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: ReactNode;
  iconColor?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, iconColor = "text-brand-primary", trend, className }: StatCardProps) {
  return (
    <Card className={className} padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-brand-foreground-subtle uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-brand-foreground mt-1 tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-brand-foreground-subtle mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl bg-brand-surface-alt", iconColor)}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-brand-foreground/5">
          <span className={cn("text-xs font-medium", trend.positive ? "text-success" : "text-error")}>
            {trend.positive ? "+" : "-"}{trend.value}%
          </span>
          <span className="text-xs text-brand-foreground-subtle ml-1">vs ultimo periodo</span>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {icon && <div className="mb-4 text-brand-foreground-subtle">{icon}</div>}
      <h3 className="text-sm font-semibold text-brand-foreground">{title}</h3>
      {description && (
        <p className="text-xs text-brand-foreground-subtle mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ============================================================
   SECTION HEADER
   ============================================================ */
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2", className)}>
      <div>
        <h2 className="text-sm font-semibold text-brand-foreground tracking-tight">{title}</h2>
        {description && (
          <p className="text-xs text-brand-foreground-subtle mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ============================================================
   BREADCRUMBS
   ============================================================ */
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center gap-1 text-xs", className)}>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-brand-foreground-subtle mx-1">/</span>}
          {item.href ? (
            <a href={item.href} className="text-brand-foreground-subtle hover:text-brand-primary transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-brand-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
