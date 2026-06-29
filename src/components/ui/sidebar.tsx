"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.HTMLAttributes<HTMLDivElement>)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (animate) setOpen(true);
  };
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (animate) setOpen(false);
  };

  return (
    <motion.div
      className={cn(
        "h-screen py-6 hidden md:flex md:flex-col bg-white flex-shrink-0 border-r border-brand-terciar/10 will-change-[width,padding] transform-gpu",
        className,
      )}
      style={{
        width: animate ? (open || isHovering ? "260px" : "64px") : "260px",
        paddingLeft: open || isHovering ? "16px" : "12px",
        paddingRight: open || isHovering ? "16px" : "12px",
      }}
      animate={{
        width: animate ? (open || isHovering ? "260px" : "64px") : "260px",
        paddingLeft: open || isHovering ? "16px" : "12px",
        paddingRight: open || isHovering ? "16px" : "12px",
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div className="flex flex-col h-full">
        {children as React.ReactNode}
      </div>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open, setOpen } = useSidebar();

  const handleMenuToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <div
      className={cn(
        "h-14 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-white w-full border-b border-brand-terciar/10 fixed top-0 left-0 z-40",
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <Menu
          className="text-brand-terciar cursor-pointer touch-none"
          onClick={handleMenuToggle}
          onTouchEnd={handleMenuToggle}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-white p-6 z-[50] flex flex-col justify-between",
              className,
            )}
          >
            <div
              className="absolute right-4 top-4 z-50 text-brand-terciar cursor-pointer touch-none"
              onClick={handleLinkClick}
              onTouchEnd={handleLinkClick}
            >
              <X className="w-6 h-6" />
            </div>
            <div onClick={handleLinkClick} onTouchEnd={handleLinkClick}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SidebarLinkProps {
  link: {
    label: string;
    href: string;
    icon: React.JSX.Element | React.ReactNode;
    badge?: number | string;
  };
  className?: string;
  onClick?: () => void;
}

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: SidebarLinkProps) => {
  const { open, setOpen } = useSidebar();

  const handleClick = () => {
    onClick?.();
    // Close mobile menu when link is clicked
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <Link
      href={link.href}
      onClick={handleClick}
      className={cn(
        "flex items-center group/sidebar transition-all duration-150 transform-gpu",
        open
          ? "justify-start gap-2.5 py-2.5 px-3 rounded-xl w-full"
          : "justify-center gap-0 py-0 px-0 rounded-xl w-10 h-10 mx-auto",
        className,
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        initial={{ maxWidth: "0px" }}
        animate={{
          maxWidth: open ? "200px" : "0px",
          opacity: open ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className="text-brand-terciar/80 text-sm group-hover/sidebar:translate-x-1 transition-transform duration-150 whitespace-nowrap inline-block !p-0 !m-0 font-medium overflow-hidden will-change-[max-width,opacity] transform-gpu"
      >
        {link.label}
      </motion.span>

      {open &&
        link.badge !== undefined &&
        link.badge !== null &&
        link.badge !== "" && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="ml-auto px-2 py-0.5 text-[9px] font-bold rounded-full bg-brand-secundar text-white min-w-[20px] text-center shrink-0"
          >
            {typeof link.badge === "number" && link.badge > 9
              ? "9+"
              : link.badge}
          </motion.span>
        )}
    </Link>
  );
};
