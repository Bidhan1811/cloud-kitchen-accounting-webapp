"use client";

import React, { useEffect, useRef } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
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

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay — CSS transition, no framer-motion */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="md:hidden fixed inset-0 z-[60] bg-[rgba(30,20,10,0.38)]"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 220ms ease",
        }}
      />

      {/* Bottom Sheet — CSS transform transition, GPU-composited */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "md:hidden fixed z-[61] glass-modal flex flex-col",
          "left-0 right-0 bottom-0 w-full max-h-[92dvh] rounded-t-[20px] !rounded-b-none border-b-0",
          className
        )}
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
      >
        {/* Drag Handle */}
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
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="bg-white/50 border-t border-[rgba(0,0,0,0.06)] px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom))] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
