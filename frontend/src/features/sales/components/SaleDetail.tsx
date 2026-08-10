"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { flushSync } from "react-dom";
import { motion } from "framer-motion";
import { Printer, Pencil, X, Trash2, Share2, Check, ChevronDown } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";
import { generateInitials, stringToColor } from "@/utils/strings";
import type { Sale, PaymentStatus, SchemaPaymentMode } from "../types/sale.types";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { SaleReceipt } from "./SaleReceipt";
import { captureReceiptFor } from "./receiptCapture";
import { usePatchSalePayment } from "../hooks/useSales";

interface SaleDetailProps {
  sale: Sale;
  onClose: () => void;
  onEdit: () => void;
  /** Optional — when provided, a Delete button appears alongside Edit (mobile footer). */
  onDelete?: () => void;
  /** Called after a successful inline payment patch so the parent can refresh its state. */
  onPaymentUpdate?: (updated: Sale) => void;
}

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["Unpaid", "Partial", "Paid"];
const PAYMENT_MODE_OPTIONS: { value: SchemaPaymentMode; label: string }[] = [
  { value: "Cash", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "Card", label: "Card" },
  { value: "Credit", label: "Credit" },
];

const STATUS_COLORS: Record<PaymentStatus, { pill: string; active: string }> = {
  Unpaid:  { pill: "text-[#C0524A] bg-[rgba(192,82,74,0.10)]",  active: "bg-[#C0524A] text-white" },
  Partial: { pill: "text-[#C8873A] bg-[rgba(200,135,58,0.12)]", active: "bg-[#C8873A] text-white" },
  Paid:    { pill: "text-[#4C9A6E] bg-[rgba(76,154,110,0.12)]", active: "bg-[#4C9A6E] text-white" },
};

export function SaleDetail({ sale, onClose, onEdit, onDelete, onPaymentUpdate }: SaleDetailProps) {
  const customerName = sale.customer?.name ?? sale.customerName ?? "Walk-in Customer";
  const customerPhone = sale.customer?.phone ?? sale.customerPhone;

  // Still used for Print — printing renders the styled HTML receipt
  // directly in a new window, unrelated to the PDF-sharing path below.
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // ── Inline payment toggle state ──────────────────────────────────────────
  const [editingPayment, setEditingPayment] = useState(false);
  const [draftStatus, setDraftStatus] = useState<PaymentStatus>(sale.paymentStatus);
  const [draftMode, setDraftMode] = useState<SchemaPaymentMode | undefined>(sale.paymentMode);
  const [draftAmount, setDraftAmount] = useState<string>(
    sale.amountPaid ? String(sale.amountPaid) : ""
  );

  // Reset draft whenever the sale prop changes (e.g., after a successful patch)
  useEffect(() => {
    setDraftStatus(sale.paymentStatus);
    setDraftMode(sale.paymentMode);
    setDraftAmount(sale.amountPaid ? String(sale.amountPaid) : "");
    setEditingPayment(false);
  }, [sale._id, sale.paymentStatus, sale.paymentMode, sale.amountPaid]);

  const isDirty =
    draftStatus !== sale.paymentStatus ||
    draftMode !== sale.paymentMode ||
    (draftStatus === "Partial" && Number(draftAmount) !== sale.amountPaid);

  const { mutateAsync: patchPayment, isPending: isSavingPayment } = usePatchSalePayment(
    (updated) => {
      onPaymentUpdate?.(updated);
      setEditingPayment(false);
    }
  );

  const handlePaymentSave = useCallback(async () => {
    if (!isDirty || isSavingPayment) return;
    const payload = {
      paymentStatus: draftStatus,
      ...(draftStatus !== "Unpaid" && draftMode ? { paymentMode: draftMode } : {}),
      ...(draftStatus === "Partial" ? { amountPaid: Number(draftAmount) } : {}),
    };
    await patchPayment({ id: sale._id, payload });
  }, [isDirty, isSavingPayment, draftStatus, draftMode, draftAmount, patchPayment, sale._id]);

  // ── Share ────────────────────────────────────────────────────────────────
  const shareCaption = `Receipt ${sale.invoiceId} \u2013 ${customerName}\n${formatCurrency(
    sale.grandTotal
  )} \u00b7 ${sale.paymentStatus}\nFrom Restro Rasoi`;

  // Pre-warm the PDF the instant this drawer mounts. jsPDF's work here is
  // cheap async computation (dynamic import + vector text/line drawing) —
  // not a blocking canvas render — so unlike the old html2canvas version,
  // this doesn't compete with the drawer's own open animation. Combined
  // with the sales list already starting this on row-tap (see
  // sales/page.tsx), the cache is almost always warm before the user
  // reaches for Share, which is what keeps the tap itself instant.
  useEffect(() => {
    captureReceiptFor(sale).catch(() => {});
  }, [sale]);

  /**
   * The ONLY share action: the PDF receipt, via the Web Share API's file
   * support where available. No text-only fallback share — if the browser
   * can't share files, we hand the user the PDF directly via download
   * instead, so what actually reaches them is always the document itself.
   */
  const handleShare = useCallback(async () => {
    // flushSync so the spinner (rare — only shows if the pre-warm above
    // hasn't finished yet) paints immediately rather than being batched
    // behind the awaited work below.
    flushSync(() => setIsSharing(true));

    try {
      const blob = await captureReceiptFor(sale);
      if (!blob) return;

      const file = new File([blob], `${sale.invoiceId}-receipt.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share?.({
            title: `Receipt \u2013 ${sale.invoiceId}`,
            text: shareCaption,
            files: [file],
          });
          return;
        } catch (err) {
          const isUserCancel = err instanceof DOMException && err.name === "AbortError";
          if (isUserCancel) return;
          console.warn("Native PDF share failed, falling back to download:", err);
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sale.invoiceId}-receipt.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsSharing(false);
    }
  }, [sale, shareCaption]);

  /**
   * Open a clean new window containing ONLY the SaleReceipt HTML and print it.
   * This completely avoids printing the app's UI (drawer, background, overlays).
   * SaleReceipt uses 100% inline CSS so it renders correctly with no external styles.
   */
  const handlePrint = useCallback(() => {
    if (!receiptRef.current) return;

    const receiptHtml = receiptRef.current.outerHTML;

    // Open off-screen so the window never flashes in the user's view
    const printWindow = window.open("", "_blank", "width=440,height=700,left=-10000,top=0");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt \u2013 ${sale.invoiceId} \u00b7 Restro Rasoi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: white;
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      /* Hide the window contents so there's no flash if the OS
         briefly shows the window before the print dialog appears */
      visibility: hidden;
    }
    .rr-print-root {
      width: 390px;
      max-width: 390px;
      margin: 0 auto;
      overflow: hidden;
    }
    @page {
      size: auto;
      margin: 8mm;
    }
    @media print {
      /* Reveal content only when the print engine renders it */
      html, body { visibility: visible; background: white; }
      html { zoom: 0.78; }
    }
  </style>
</head>
<body>
  <div class="rr-print-root">
    ${receiptHtml}
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
        window.onafterprint = function () { window.close(); };
      }, 400);
    };
  </script>
</body>
</html>`);

    printWindow.document.close();
  }, [receiptRef, sale.invoiceId]);

  // ── Inline payment editor UI ─────────────────────────────────────────────
  const paymentEditor = (
    <div className="glass-card px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#9E8E80] uppercase tracking-wide font-[500]">Payment</p>
        {!editingPayment ? (
          <button
            onClick={() => setEditingPayment(true)}
            className="text-[11px] text-[#C8873A] font-[500] flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-0.5 rounded-lg hover:bg-[rgba(200,135,58,0.10)]"
          >
            <ChevronDown size={12} />
            Change
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingPayment(false);
              setDraftStatus(sale.paymentStatus);
              setDraftMode(sale.paymentMode);
              setDraftAmount(sale.amountPaid ? String(sale.amountPaid) : "");
            }}
            className="text-[11px] text-[#9E8E80] font-[500] px-2 py-0.5 rounded-lg hover:bg-[rgba(158,142,128,0.10)] transition-opacity"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Status pill toggle */}
      <div className="flex gap-1.5 p-1 bg-[rgba(0,0,0,0.04)] rounded-xl">
        {PAYMENT_STATUS_OPTIONS.map((s) => {
          const colors = STATUS_COLORS[s];
          const isActive = draftStatus === s;
          return (
            <button
              key={s}
              disabled={!editingPayment}
              onClick={() => {
                setDraftStatus(s);
                if (s === "Paid" && !draftMode) setDraftMode("Cash");
                if (s === "Partial" && !draftMode) setDraftMode("Cash");
              }}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-[600] transition-all duration-200
                ${isActive
                  ? colors.active + " shadow-sm"
                  : editingPayment
                    ? "text-[#6B5D50] hover:bg-white/60"
                    : "text-[#9E8E80]"
                }
                ${!editingPayment ? "cursor-default" : "cursor-pointer"}
              `}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Payment mode — shown only when status is Paid or Partial */}
      {(editingPayment ? draftStatus !== "Unpaid" : sale.paymentStatus !== "Unpaid") && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] text-[#9E8E80] uppercase tracking-wide font-[500]">Mode</p>
          <div className="flex gap-1.5 flex-wrap">
            {PAYMENT_MODE_OPTIONS.map(({ value, label }) => {
              const isActive = (editingPayment ? draftMode : sale.paymentMode) === value;
              return (
                <button
                  key={value}
                  disabled={!editingPayment}
                  onClick={() => setDraftMode(value)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-[500] border transition-all duration-150
                    ${isActive
                      ? "bg-[#8B5E34] text-white border-[#8B5E34]"
                      : editingPayment
                        ? "bg-white/60 text-[#6B5D50] border-[rgba(139,94,52,0.20)] hover:border-[#8B5E34] hover:text-[#8B5E34]"
                        : "bg-white/40 text-[#9E8E80] border-[rgba(158,142,128,0.15)]"
                    }
                    ${!editingPayment ? "cursor-default" : "cursor-pointer"}
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Amount paid — shown only for Partial */}
      {(editingPayment ? draftStatus === "Partial" : sale.paymentStatus === "Partial") && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] text-[#9E8E80] uppercase tracking-wide font-[500]">
            Amount Received
          </p>
          {editingPayment ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8E80] text-[13px] font-mono">₹</span>
              <input
                type="number"
                min={0}
                max={sale.grandTotal}
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-xl bg-white/80 border border-[rgba(139,94,52,0.25)] text-[13px] font-mono text-[#1C1410] outline-none focus:border-[#C8873A] transition-colors"
                placeholder="0"
              />
            </div>
          ) : (
            <span className="font-mono text-[13px] font-[600] text-[#4C9A6E]">
              {formatCurrency(sale.amountPaid)}
            </span>
          )}
        </div>
      )}

      {/* Save button — appears only when there's a dirty change */}
      {editingPayment && isDirty && (
        <button
          onClick={handlePaymentSave}
          disabled={isSavingPayment}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#4C9A6E] text-white text-[13px] font-[600] hover:bg-[#3d8060] transition-colors disabled:opacity-60"
        >
          {isSavingPayment ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={15} />
          )}
          {isSavingPayment ? "Saving…" : "Save Payment"}
        </button>
      )}
    </div>
  );

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

        {/* Meta row — Date only (payment moved to interactive editor below) */}
        <div className="glass-card px-4 py-3">
          <p className="text-[11px] text-[#9E8E80] uppercase tracking-wide font-[500] mb-1">Date</p>
          <div className="text-[13px] font-[500] text-[#1C1410]">{formatDateTime(sale.date)}</div>
        </div>

        {/* Inline payment editor */}
        {paymentEditor}

        {/* Items */}
        <div>
          <p className="text-[12px] uppercase tracking-wide font-[600] text-[#9E8E80] mb-3">Items</p>
          <div className="glass-card p-3 flex flex-col gap-[2px]">
            <div className="grid grid-cols-[1fr_40px_80px_80px] text-[10px] uppercase tracking-wide text-[#9E8E80] font-[500] px-1 mb-1">
              <span>Item</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
            </div>
            {sale.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_40px_80px_80px] items-center px-3 py-2.5 rounded-[12px] hover:bg-[rgba(255,255,255,0.20)] transition-colors max-md:px-1 max-md:py-2">
                <span className="text-[13px] text-[#1C1410] flex items-center gap-1.5">
                  {item.itemName}
                  {item.portion === "half" && (
                    <span className="inline-flex items-center justify-center text-[10px] font-[700] text-[#C8873A] bg-[rgba(200,135,58,0.12)] border border-[rgba(200,135,58,0.25)] rounded-md px-1.5 py-0.5 leading-none shrink-0">
                      ½
                    </span>
                  )}
                </span>
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

  return (
    <>
      {/* Hidden receipt — shown during print via @media print / .print-receipt-root */}
      <div
        className="print-receipt-root"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <SaleReceipt ref={receiptRef} sale={sale} />
      </div>

      {/*
        Both variants are always mounted, gated purely by CSS breakpoints —
        no JS isMobile check. MobileBottomDrawer already self-hides on
        desktop via its own internal md:hidden classes; the motion.div
        below is explicitly wrapped in hidden md:block to mirror that.
        Previously this branched on a useIsMobile() hook backed by
        matchMedia, which is unavoidably `false` on first render (no
        window access during SSR/hydration) — so every mount briefly
        committed to the desktop side-slide animation before flipping to
        the mobile bottom-sheet a tick later, which is what made the
        drawer look like it was "opening sideways" on phones.
      */}

      <MobileBottomDrawer
        open={true}
        onClose={onClose}
        title={sale.invoiceId}
        subtitle={`Status: ${sale.paymentStatus}`}
        footer={
          <div className="flex gap-2.5">
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/60 border border-[rgba(192,82,74,0.25)] text-[#C0524A]"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={handleShare}
              disabled={isSharing}
              aria-label="Share"
              title="Share"
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-white/80 border border-[rgba(200,135,58,0.30)] text-[#C8873A] disabled:opacity-60"
            >
              {isSharing ? (
                <span className="w-4 h-4 border-2 border-[#C8873A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Share2 size={18} />
              )}
            </button>
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

      <div className="hidden md:block">
        <motion.div
          className="glass-modal fixed top-4 right-4 bottom-4 w-[min(520px,calc(100vw-32px))] z-[51] flex flex-col overflow-hidden"
          initial={{ x: "calc(100% + 32px)", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "calc(100% + 32px)", opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Header */}
          <div className="px-7 pt-7 pb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[14px] font-[600] text-[#C8873A]">{sale.invoiceId}</span>
              <StatusBadge status={sale.paymentStatus} />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-icon"
                onClick={handleShare}
                disabled={isSharing}
                aria-label="Share"
                title="Share"
              >
                {isSharing ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <Share2 size={16} />
                )}
              </button>
              <button className="btn-icon" onClick={handlePrint} aria-label="Print invoice">
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
      </div>
    </>
  );
}