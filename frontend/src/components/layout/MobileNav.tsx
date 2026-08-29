"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { LayoutDashboard, ShoppingBag, Receipt, Users, MoreHorizontal, UtensilsCrossed, BookOpen, X, Settings } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";
import { AnimatePresence, motion } from "framer-motion";

const BOTTOM_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", adminOnly: true },
  { label: "Sales", icon: ShoppingBag, href: "/sales" },
  { label: "Expenses", icon: Receipt, href: "/expenditure" },
  { label: "Customers", icon: Users, href: "/customers", adminOnly: true },
];

// Items shown inside the "More" popover
const MORE_ITEMS = [
  {
    label: "Menu",
    icon: UtensilsCrossed,
    href: "/menu",
    adminOnly: true,
    description: "Manage your menu items",
  },
  {
    label: "Ledgers",
    icon: BookOpen,
    href: "/ledger",
    adminOnly: true,
    description: "View credit customer accounts",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    adminOnly: true,
    description: "App configuration & staff",
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isOwner } = useAuthContext();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const visible = BOTTOM_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin || isOwner
  );
  const visibleMore = MORE_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin || isOwner
  );

  // "More" is active if the current page is one of the more-items' routes
  const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href));

  // Close popover on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  // Close on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-[18] bg-black/20 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* More sheet — slides up from above the nav bar */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="more-sheet"
            ref={sheetRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            data-more-sheet
            className={cn(
              "md:hidden fixed z-[19] left-4 right-4",
              "bottom-[calc(env(safe-area-inset-bottom)+72px)]",
              "bg-white/90 backdrop-blur-xl rounded-2xl",
              "border border-white/60 shadow-[0_8px_32px_rgba(28,20,10,0.14)]",
              "overflow-hidden"
            )}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[rgba(0,0,0,0.06)]">
              <span className="text-[11px] font-[700] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                style={{ background: "rgba(128,128,128,0.15)", color: "var(--text-secondary)" }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Navigation items */}
            <div className="flex flex-col gap-1 p-2">
              {visibleMore.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setMoreOpen(false);
                      router.push(item.href);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left transition-colors",
                      isActive
                        ? "bg-[rgba(200,135,58,0.10)]"
                        : "hover:bg-[rgba(0,0,0,0.04)]"
                    )}
                    style={{ color: isActive ? "var(--accent)" : "var(--text-primary)" }}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0",
                        isActive
                          ? "bg-[rgba(200,135,58,0.15)]"
                          : "bg-[rgba(0,0,0,0.06)]"
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-[14px]", isActive ? "font-[700]" : "font-[600]")}>
                        {item.label}
                      </p>
                      <p className="text-[11px] mt-[1px]" style={{ color: "var(--text-tertiary)" }}>{item.description}</p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C8873A] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav
        style={{ willChange: "transform" }}
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-[20]",
          "bg-white/80 backdrop-blur-xl border-t border-white/60",
          "flex items-center justify-around",
          "pb-[env(safe-area-inset-bottom)]"
        )}
        aria-label="Mobile navigation"
      >
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-[3px] py-3 px-4 min-w-[52px] transition-all",
                isActive ? "text-[#C8873A]" : "text-[#9E8E80]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={cn("text-[10px]", isActive ? "font-[600]" : "font-[400]")}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        {visibleMore.length > 0 && (
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex flex-col items-center justify-center gap-[3px] py-3 px-4 min-w-[52px] transition-all",
              isMoreActive || moreOpen ? "text-[#C8873A]" : "text-[#9E8E80]"
            )}
            aria-expanded={moreOpen}
            aria-label="More navigation options"
          >
            <MoreHorizontal
              size={22}
              strokeWidth={isMoreActive || moreOpen ? 2.2 : 1.8}
            />
            <span className={cn("text-[10px]", isMoreActive || moreOpen ? "font-[600]" : "font-[400]")}>
              More
            </span>
          </button>
        )}
      </nav>
    </>
  );
}