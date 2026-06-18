"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

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
      <MobileSidebar {...(props as any)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-screen py-6 hidden md:flex md:flex-col bg-white w-[260px] flex-shrink-0 border-r border-brand-terciar/10 will-change-[width,padding] transform-gpu",
        className
      )}
      animate={{
        width: animate ? (open ? "260px" : "64px") : "260px",
        paddingLeft: open ? "16px" : "12px",
        paddingRight: open ? "16px" : "12px",
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children as any}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "h-14 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-white w-full border-b border-brand-terciar/10 fixed top-0 left-0 z-40"
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <Menu
          className="text-brand-terciar cursor-pointer"
          onClick={() => setOpen(!open)}
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
              className
            )}
          >
            <div
              className="absolute right-4 top-4 z-50 text-brand-terciar cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              <X className="w-6 h-6" />
            </div>
            {children}
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
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center group/sidebar transition-all duration-150 transform-gpu",
        open 
          ? "justify-start gap-2.5 py-2.5 px-3 rounded-xl w-full" 
          : "justify-center gap-0 py-0 px-0 rounded-xl w-10 h-10 mx-auto",
        className
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
    </Link>
  );
};
