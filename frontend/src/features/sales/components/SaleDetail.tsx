"use client";

import React from "react";
import { motion } from "framer-motion";
import { Printer, Pencil, X, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";
import { generateInitials, stringToColor } from "@/utils/strings";
import type { Sale } from "../types/sale.types";
import { useIsMobile } from "@/hooks";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";

interface SaleDetailProps {
  sale: Sale;
  onClose: () => void;
  onEdit: () => void;
  /** Optional — when provided, a Delete button appears alongside Edit (mobile footer). */
  onDelete?: () => void;
}

export function SaleDetail({ sale, onClose, onEdit, onDelete }: SaleDetailProps) {
  const customerName = sale.customer?.name ?? sale.customerName ?? "Walk-in Customer";
  const customerPhone = sale.customer?.phone ?? sale.customerPhone;

  const isMobile = useIsMobile();

  const content = (
    <>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-5 max-md:px-0">
        {/* Customer info */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-[700] text-[#C8873A] flex-shrink-0"
            style={{ background: stringToColor(customerName) }}
          >
            {generateInitials(customerName)}
          </div>
          <div>
            <p className="text-[15px] font-[600] text-[#1C1410]">{customerName}</p>
            {customerPhone && (
              <p className="text-[12px] text-[#9E8E80]">{customerPhone}</p>
            )}
            {sale.customerAddress && (
              <p className="text-[12px] text-[#9E8E80]">{sale.customerAddress}</p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Date", value: formatDateTime(sale.date) },
            { label: "Payment Mode", value: sale.paymentMode ?? "—" },
            { label: "Payment Status", value: <StatusBadge status={sale.paymentStatus} /> },
          ].map((item) => (
            <div key={item.label} className="glass-card px-4 py-3">
              <p className="text-[11px] text-[#9E8E80] uppercase tracking-wide font-[500] mb-1">{item.label}</p>
              <div className="text-[13px] font-[500] text-[#1C1410]">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div>
          <p className="text-[12px] uppercase tracking-wide font-[600] text-[#9E8E80] mb-3">Items</p>
          <div className="flex flex-col gap-[2px]">
            <div className="grid grid-cols-[1fr_40px_80px_80px] text-[10px] uppercase tracking-wide text-[#9E8E80] font-[500] px-1 mb-1">
              <span>Item</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
            </div>
            {sale.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_40px_80px_80px] items-center px-3 py-2.5 rounded-[12px] hover:bg-[rgba(255,255,255,0.20)] transition-colors max-md:px-1 max-md:py-2">
                <span className="text-[13px] text-[#1C1410]">{item.itemName}</span>
                <span className="text-[12px] text-[#9E8E80] text-center">{item.quantity}</span>
                <span className="font-mono text-[12px] text-right text-[#6B5D50]">{formatCurrency(item.unitPrice)}</span>
                <span className="font-mono text-[13px] font-[600] text-right">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="glass-card p-4 flex flex-col gap-2">
          {[
            { label: "Items Total", value: sale.itemsTotal },
            sale.deliveryCharge > 0 && { label: "Delivery", value: sale.deliveryCharge },
          ].filter(Boolean).map((row) => {
            const r = row as { label: string; value: number };
            return (
              <div key={r.label} className="flex justify-between text-[13px]">
                <span className="text-[#6B5D50]">{r.label}</span>
                <span className="font-mono font-[600]">{formatCurrency(r.value)}</span>
              </div>
            );
          })}
          <div className="h-px bg-[rgba(255,255,255,0.40)] my-1" />
          <div className="flex justify-between text-[15px] font-[700]">
            <span>Grand Total</span>
            <span className="font-mono text-[#4C9A6E]">{formatCurrency(sale.grandTotal)}</span>
          </div>
          {sale.paymentStatus === "Partial" && (
            <>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#6B5D50]">Amount Received</span>
                <span className="font-mono font-[600] text-[#4C9A6E]">{formatCurrency(sale.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#6B5D50]">Balance Due</span>
                <span className="font-mono font-[600] text-[#C0524A]">{formatCurrency(sale.balanceDue)}</span>
              </div>
            </>
          )}
        </div>

        {/* Timeline */}
        <div>
          <p className="text-[12px] uppercase tracking-wide font-[600] text-[#9E8E80] mb-3">Timeline</p>
          <div className="flex flex-col gap-2">
            {[
              { label: "Sale created", time: sale.createdAt, icon: "🧾" },
              sale.paymentStatus === "Paid" && { label: "Payment received", time: sale.createdAt, icon: "✅" },
              sale.paymentStatus === "Partial" && { label: "Partial payment received", time: sale.createdAt, icon: "🟡" },
            ]
              .filter((event): event is { label: string; time: string; icon: string } => !!event)
              .map((event) => (
                <div key={event.label} className="flex items-center gap-3 text-[13px]">
                  <span className="text-[16px]">{event.icon}</span>
                  <div>
                    <p className="font-[500] text-[#1C1410]">{event.label}</p>
                    <p className="text-[11px] text-[#9E8E80]">{formatDateTime(event.time)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="glass-card p-4">
            <p className="text-[11px] uppercase tracking-wide font-[600] text-[#9E8E80] mb-1">Notes</p>
            <p className="text-[13px] text-[#6B5D50]">{sale.notes}</p>
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <MobileBottomDrawer
        open={true}
        onClose={onClose}
        title={sale.invoiceId}
        subtitle={`Status: ${sale.paymentStatus}`}
        footer={
          <div className="flex gap-3">
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-1 py-3 bg-white/60 border border-[rgba(192,82,74,0.25)] text-[#C0524A] rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex-1 py-3 bg-[#8B5E34] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
            >
              <Pencil size={16} /> Edit Sale
            </button>
          </div>
        }
      >
        {content}
      </MobileBottomDrawer>
    );
  }

  return (
    <motion.div
      className="glass-modal fixed top-4 right-4 bottom-4 w-[min(520px,calc(100vw-32px))] z-[51] flex flex-col overflow-hidden"
      initial={{ x: "calc(100% + 32px)", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "calc(100% + 32px)", opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Header — unchanged, no Delete button here (desktop untouched) */}
      <div className="px-7 pt-7 pb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[14px] font-[600] text-[#C8873A]">{sale.invoiceId}</span>
          <StatusBadge status={sale.paymentStatus} />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-icon" onClick={() => window.print()} aria-label="Print invoice">
            <Printer size={16} />
          </button>
          <button className="btn-icon" onClick={onEdit} aria-label="Edit sale">
            <Pencil size={16} />
          </button>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="h-px bg-[rgba(255,255,255,0.40)] mx-7" />

      {content}
    </motion.div>
  );
}