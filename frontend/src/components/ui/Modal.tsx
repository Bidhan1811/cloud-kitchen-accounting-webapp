"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

/**
 * Generic form modal, styled to match ConfirmDialog's portal + glass-modal
 * animation pattern but sized for form content (Payment / Adjustment
 * forms) rather than a fixed confirm/cancel prompt.
 */
export function Modal({ open, onClose, title, subtitle, children, maxWidth = "440px" }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-[rgba(30,20,10,0.22)] backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-modal p-7 w-full max-h-[90vh] overflow-y-auto"
              style={{ maxWidth }}
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 id="modal-title" className="font-display text-[18px] font-[600] text-[#1C1410]">
                    {title}
                  </h2>
                  {subtitle && <p className="text-[13px] text-[#9E8E80] mt-[2px]">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#9E8E80] hover:bg-[rgba(30,20,10,0.06)] transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}