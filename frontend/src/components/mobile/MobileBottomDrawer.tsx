"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface MobileBottomDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function MobileBottomDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
}: MobileBottomDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="mobile-drawer-overlay"
            className="fixed inset-0 z-[60] bg-[rgba(30,20,10,0.40)] backdrop-blur-[4px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            key="mobile-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "fixed z-[61] glass-modal flex flex-col md:hidden",
              "left-0 right-0 bottom-0 w-full max-h-[92dvh] rounded-t-[20px] !rounded-b-none border-b-0",
              className
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Drag Handle Area */}
            <div className="w-full flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-[rgba(0,0,0,0.15)] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pb-3 flex-shrink-0">
              <div>
                {title && (
                  <h2 className="font-display text-[20px] font-[600] text-[#1C1410]">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-[13px] text-[#9E8E80] mt-[2px]">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="btn-icon mt-[2px] flex-shrink-0 bg-white/40 rounded-full"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-[rgba(0,0,0,0.06)] mx-5" />

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-[env(safe-area-inset-bottom)]">
              {children}
            </div>

            {/* Sticky Footer */}
            {footer && (
              <div className="bg-white/50 backdrop-blur-md border-t border-[rgba(0,0,0,0.06)] px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom))] flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
