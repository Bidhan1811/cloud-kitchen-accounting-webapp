"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface MobileSectionAccordionProps {
  title: string;
  count?: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function MobileSectionAccordion({
  title,
  count,
  defaultExpanded = true,
  children,
  className,
}: MobileSectionAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("md:hidden mb-4", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 px-1 mb-2 active:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {title}
          </h3>
          {count !== undefined && (
            <span className="text-[12px] bg-glass-input border border-glass-border rounded-full px-2 py-0.5 text-text-secondary font-medium">
              {count}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-text-tertiary"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto", marginTop: 4 },
              collapsed: { opacity: 0, height: 0, marginTop: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
