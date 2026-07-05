import type { ComponentPropsWithoutRef, ReactNode } from "react";

/* ============================================================
   BADGE
   ------------------------------------------------------------
   Badge compacto para status, tags e rotulos curtos.
   Usa tokens Portuguese do Tailwind (brand-primary, etc).
   ============================================================ */
export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "neutral";

const badgeVariants: Record<BadgeVariant, string> = {
  primary: "bg-brand-primary/10 text-brand-primary",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  neutral: "bg-gray-50 text-gray-600",
};

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  className = "",
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${badgeVariants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

