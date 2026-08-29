"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  // ── Drag state ──────────────────────────────────────────────────────
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset drag offset whenever the drawer opens/closes
  useEffect(() => {
    setDragY(0);
    setIsDragging(false);
  }, [open]);

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

  // ── Touch handlers ───────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartTime.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    // Only allow dragging downward
    if (delta > 0) {
      setDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const elapsed = Math.max(Date.now() - dragStartTime.current, 1);
    const velocity = dragY / elapsed; // px/ms

    // Close if dragged far enough OR flicked quickly
    if (dragY > 120 || velocity > 0.4) {
      onClose();
    } else {
      // Snap back
      setDragY(0);
    }
  };

  // ── Computed transform ───────────────────────────────────────────────
  // While dragging: shift by dragY (no transition)
  // Closed: slide fully off-screen
  // Open (idle): sit at 0
  const translateY = !open ? "100%" : `${dragY}px`;
  const transition = isDragging
    ? "none"
    : "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)";

  if (!mounted) return null;

  return createPortal(
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

      {/* Bottom Sheet panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "mobile-bottom-drawer",
          "md:hidden fixed z-[61] flex flex-col",
          "left-0 right-0 bottom-0 w-full max-h-[92dvh]",
          "rounded-t-[28px] border-t border-x border-[var(--glass-border)]",
          "shadow-[0_-8px_40px_rgba(140,110,60,0.18)]",
          className
        )}
        style={{
          background: "var(--mobile-bottom-drawer-bg, #F2EDE8)",
          transform: `translateY(${translateY})`,
          transition,
          willChange: "transform",
        }}
      >
        {/* ── Drag Handle — touch target for the whole strip ── */}
        <div
          className="w-full flex justify-center pt-4 pb-3 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={cn(
              "w-12 h-1.5 rounded-full transition-colors duration-150",
              isDragging ? "bg-[rgba(0,0,0,0.28)]" : "bg-[rgba(0,0,0,0.12)]"
            )}
          />
        </div>

        {/* Header — also draggable so the whole top area feels responsive */}
        <div
          className="flex items-start justify-between px-6 pt-1 pb-5 flex-shrink-0 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div>
            {title && (
              <h2 className="font-display text-[22px] font-[600] leading-tight" style={{ color: "var(--text-primary)" }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[14px] mt-[4px]" style={{ color: "var(--text-tertiary)" }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] transition-colors mt-[2px] flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} className="text-[#6B5D50]" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(0,0,0,0.06)] mx-6 flex-shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div
            className="flex-shrink-0 px-6 py-5"
            style={{
              paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
              background: "var(--mobile-bottom-drawer-bg, #F2EDE8)",
              borderTop: "1px solid var(--glass-border)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
