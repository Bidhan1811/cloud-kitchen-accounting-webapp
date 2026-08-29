"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  X,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import Link from "next/link";
import type { Sale } from "@/features/sales/types/sale.types";
import type { Customer } from "@/features/customers/types/customer.types";

export interface Notification {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  icon: React.ReactNode;
  title: string;
  body: string;
  href?: string;
  timestamp?: string;
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Derive notifications purely from cached data — zero extra API calls. */
export function deriveNotifications(
  sales: Sale[],
  customers: Customer[],
  pendingAmount?: number
): Notification[] {
  const notes: Notification[] = [];

  // ── 1. Overdue unpaid orders (unpaid for > 3 days) ─────────────
  const overdue = sales
    .filter(
      (s) =>
        (s.paymentStatus === "Unpaid" || s.paymentStatus === "Partial") &&
        daysSince(s.date) > 3
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (overdue.length > 0) {
    const oldest = overdue[0];
    const age = daysSince(oldest.date);
    notes.push({
      id: `overdue-${oldest._id}`,
      type: "danger",
      icon: <Clock size={14} />,
      title: `${overdue.length} Overdue Order${overdue.length > 1 ? "s" : ""}`,
      body: `Oldest: ${oldest.customerName} · ${formatCurrency(oldest.balanceDue)} due — ${age} days ago`,
      href: "/sales?status=Unpaid",
      timestamp: oldest.date,
    });
  }

  // ── 2. High-value pending orders (unpaid, ≥ ₹500) ──────────────
  const highValue = sales
    .filter((s) => s.paymentStatus === "Unpaid" && s.balanceDue >= 500)
    .sort((a, b) => b.balanceDue - a.balanceDue);

  if (highValue.length > 0) {
    const top = highValue[0];
    notes.push({
      id: `highvalue-${top._id}`,
      type: "warning",
      icon: <AlertCircle size={14} />,
      title: "High-Value Pending",
      body: `${top.customerName} owes ${formatCurrency(top.balanceDue)} · Invoice ${top.invoiceId}`,
      href: "/sales?status=Unpaid",
      timestamp: top.date,
    });
  }

  // ── 3. Partially paid orders ────────────────────────────────────
  const partial = sales.filter((s) => s.paymentStatus === "Partial");
  if (partial.length > 0) {
    const totalPartialDue = partial.reduce((sum, s) => sum + s.balanceDue, 0);
    notes.push({
      id: "partial-orders",
      type: "warning",
      icon: <AlertCircle size={14} />,
      title: `${partial.length} Partial Payment${partial.length > 1 ? "s" : ""}`,
      body: `${formatCurrency(totalPartialDue)} still pending across partial orders`,
      href: "/sales?status=Partial",
    });
  }

  // ── 4. Credit customers with high outstanding balance ───────────
  const topDebtors = customers
    .filter(
      (c) =>
        c.isCreditCustomer &&
        c.creditBalance &&
        c.creditBalance.amount > 0 &&
        !c.creditBalance.isAdvance
    )
    .sort(
      (a, b) => (b.creditBalance?.amount ?? 0) - (a.creditBalance?.amount ?? 0)
    )
    .slice(0, 2);

  topDebtors.forEach((c) => {
    notes.push({
      id: `credit-${c._id}`,
      type: "warning",
      icon: <Users size={14} />,
      title: `Credit Balance — ${c.name}`,
      body: `${formatCurrency(c.creditBalance!.amount)} outstanding on ledger`,
      href: `/ledger/${c._id}`,
    });
  });

  // ── 5. Total pending alert (only when no overdue exist) ─────────
  if (pendingAmount && pendingAmount > 5000 && overdue.length === 0) {
    notes.push({
      id: "total-pending",
      type: "info",
      icon: <TrendingUp size={14} />,
      title: "Pending Receivables",
      body: `${formatCurrency(pendingAmount)} total pending this month`,
      href: "/sales?status=Unpaid",
    });
  }

  // ── 6. All clear ───────────────────────────────────────────────
  if (notes.length === 0) {
    notes.push({
      id: "all-clear",
      type: "success",
      icon: <CheckCircle size={14} />,
      title: "All Clear!",
      body: "No pending payments or overdue orders. You're on top of things 🎉",
    });
  }

  return notes;
}

const TYPE_STYLES = {
  danger:  { bg: "rgba(192,82,74,0.10)",  border: "rgba(192,82,74,0.20)",  icon: "#C0524A", dot: "#C0524A" },
  warning: { bg: "rgba(184,134,46,0.10)", border: "rgba(184,134,46,0.20)", icon: "#B8862E", dot: "#B8862E" },
  info:    { bg: "rgba(200,135,58,0.08)", border: "rgba(200,135,58,0.15)", icon: "#C8873A", dot: "#C8873A" },
  success: { bg: "rgba(76,154,110,0.10)", border: "rgba(76,154,110,0.18)", icon: "#4C9A6E", dot: "#4C9A6E" },
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  anchorRef,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorRef]);

  const unreadCount = notifications.filter((n) => n.type !== "success").length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="absolute right-0 top-[calc(100%+8px)] z-[200] w-[340px] max-w-[calc(100vw-2rem)]"
          style={{
            background: "var(--glass-modal)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid var(--glass-border)",
            borderRadius: "20px",
            boxShadow: "var(--shadow-modal)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={15} style={{ color: "var(--accent)" }} />
              <span
                className="text-[14px] font-[600]"
                style={{ color: "var(--text-primary)" }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-[700] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:bg-[rgba(158,142,128,0.12)]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X size={13} />
            </button>
          </div>

          {/* List */}
          <div
            className="flex flex-col gap-1 p-2 max-h-[420px] overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {notifications.map((n, i) => {
              const s = TYPE_STYLES[n.type];
              const card = (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.15 }}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-[12px] transition-all"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${s.dot}22`, color: s.icon }}
                  >
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-[600] leading-[1.3]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {n.title}
                    </p>
                    <p
                      className="text-[11px] leading-[1.4] mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {n.body}
                    </p>
                    {n.timestamp && (
                      <p
                        className="text-[10px] mt-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {formatDate(n.timestamp)}
                      </p>
                    )}
                  </div>
                  {n.type !== "success" && (
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: s.dot }}
                    />
                  )}
                </motion.div>
              );

              return n.href ? (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={onClose}
                  className="block hover:opacity-90 transition-opacity"
                >
                  {card}
                </Link>
              ) : (
                <div key={n.id}>{card}</div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 border-t text-center"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <Link
              href="/sales"
              onClick={onClose}
              className="text-[11px] font-[500] transition-colors hover:underline"
              style={{ color: "var(--accent)" }}
            >
              View all sales →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
