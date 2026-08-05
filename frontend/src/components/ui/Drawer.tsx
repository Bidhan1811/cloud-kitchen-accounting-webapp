"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, children, className, footer }: DrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape key
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
            key="drawer-overlay"
            className="fixed inset-0 z-[50] bg-[rgba(30,20,10,0.20)] backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={{ willChange: "transform" }}
            className={cn(
              "fixed z-[51] glass-modal flex flex-col",
              // Desktop: right side
              "top-4 right-4 bottom-4 w-[min(480px,calc(100vw-32px))]",
              // Mobile: bottom sheet
              "max-md:top-auto max-md:left-4 max-md:right-4 max-md:bottom-0 max-md:w-auto max-md:h-[92dvh] max-md:rounded-t-[28px] !max-md:rounded-b-none",
              className
            )}
            initial={{ x: "calc(100% + 32px)", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "calc(100% + 32px)", opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            // Mobile override via CSS - animated upward on small screens
          >
            {/* Header */}
            <div className="flex items-start justify-between px-7 pt-7 pb-4 flex-shrink-0">
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
                className="btn-icon mt-[2px] flex-shrink-0"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-[rgba(255,255,255,0.40)] mx-7" />

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-7 py-5">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <>
                <div className="h-px bg-[rgba(255,255,255,0.40)] mx-7" />
                <div className="px-7 py-5 flex-shrink-0">
                  {footer}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
