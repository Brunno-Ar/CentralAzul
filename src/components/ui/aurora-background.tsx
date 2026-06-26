"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
}

export const AuroraBackground = ({
  className,
  children,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-brand-principal text-brand-secundar transition-bg overflow-hidden transform-gpu",
          "bg-[repeating-linear-gradient(100deg,var(--brand-secundar)_10%,var(--brand-extra3)_15%,var(--brand-secundar)_20%,var(--brand-extra1)_25%,var(--brand-extra3)_30%)]",
          "bg-[size:300%_200%] bg-[position:50%_50%]",
          "animate-aurora-slow",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </main>
  );
};
