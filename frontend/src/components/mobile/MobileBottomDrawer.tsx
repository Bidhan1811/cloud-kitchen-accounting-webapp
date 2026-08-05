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

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Dim overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="md:hidden fixed inset-0 z-[60] bg-black/50"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 220ms ease",
        }}
      />

      {/* Bottom Sheet panel — solid opaque background, no transparency bleed */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "md:hidden fixed z-[61] flex flex-col",
          "left-0 right-0 bottom-0 w-full max-h-[92dvh]",
          "rounded-t-[24px] border-t border-x border-[rgba(255,255,255,0.35)]",
          "shadow-[0_-8px_40px_rgba(140,110,60,0.18)]",
          className
        )}
        style={{
          background: "rgba(255, 250, 242, 0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-[rgba(0,0,0,0.18)] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4 flex-shrink-0">
          <div>
            {title && (
              <h2 className="font-display text-[20px] font-[600] text-[#1C1410] leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[13px] text-[#9E8E80] mt-[3px]">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/8 hover:bg-black/12 transition-colors mt-[2px] flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} className="text-[#6B5D50]" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(0,0,0,0.07)] mx-5 flex-shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div
            className="flex-shrink-0 px-5 py-4 border-t border-[rgba(0,0,0,0.07)]"
            style={{
              paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
              background: "rgba(255, 250, 242, 0.98)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
