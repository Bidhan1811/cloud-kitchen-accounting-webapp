"use client";

import type { Sale } from "../types/sale.types";

/**
 * Cache of in-flight/completed receipt PDF generations, keyed by sale ID.
 *
 * Same purpose as before: the sales list triggers this the instant a row
 * is tapped, so it's ready (or nearly ready) before the user reaches for
 * Share. The difference from the old html2canvas approach is that this
 * work is now cheap enough that pre-caching is mostly a nicety rather than
 * a necessity — jsPDF draws text/lines directly with no DOM rendering, no
 * webfont loading, and no rasterization pass, so a fresh generation
 * typically finishes in single-digit milliseconds once the jsPDF chunk
 * itself has been fetched.
 */

const pdfCache = new Map<string, Promise<Blob | null>>();

function fmt(n: number): string {
  // Deliberately NOT using Intl currency formatting with "INR" — that
  // inserts the ₹ symbol (U+20B9), which jsPDF's built-in Helvetica font
  // has no glyph for (it only supports the standard WinAnsi character
  // set). Hitting that unsupported character mid-string is what caused
  // the stray superscript "1" and the odd gaps between the following
  // digits — jsPDF's width-table lookup gets thrown off right after it.
  // A plain ASCII "Rs." prefix avoids the problem entirely.
  return `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
}

async function buildReceiptPdf(sale: Sale): Promise<Blob | null> {
  try {
    const { jsPDF } = await import("jspdf");

    const customerName = sale.customer?.name ?? sale.customerName ?? "Walk-in Customer";
    const customerPhone = sale.customer?.phone ?? sale.customerPhone;
    const date = new Date(sale.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const pageWidth = 320; // pt — receipt-style narrow width, ~4.4in
    const margin = 24;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 16;

    // jsPDF needs a page height up front. Estimate generously from content
    // size — a receipt-length page, not a paginated multi-page document,
    // so we don't need exact measurement, just "enough room."
    const estimatedHeight =
      440 +
      sale.items.length * rowHeight +
      (sale.notes ? 40 : 0) +
      (sale.paymentStatus === "Partial" ? 30 : 0) +
      (sale.deliveryCharge > 0 ? 14 : 0);

    const doc = new jsPDF({ unit: "pt", format: [pageWidth, estimatedHeight] });

    let y = margin;
    const hr = () => {
      doc.setDrawColor("#E5E7EB");
      doc.line(margin, y, pageWidth - margin, y);
    };

    // ── Brand header ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor("#111827");
    doc.text("Restro Rasoi", pageWidth / 2, y + 10, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#6B7280");
    doc.text("CLOUD KITCHEN", pageWidth / 2, y + 22, { align: "center" });
    y += 38;
    hr();
    y += 16;

    // ── Invoice / date / status ──
    doc.setFontSize(8);
    doc.setTextColor("#6B7280");
    doc.text("INVOICE", margin, y);
    doc.text("DATE", pageWidth - margin, y, { align: "right" });
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#111827");
    doc.text(sale.invoiceId, margin, y);
    doc.text(date, pageWidth - margin, y, { align: "right" });
    y += 16;

    const statusColor =
      sale.paymentStatus === "Paid"
        ? "#2E7D52"
        : sale.paymentStatus === "Partial"
        ? "#B8862E"
        : "#C0524A";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(statusColor);
    doc.text(sale.paymentStatus, pageWidth - margin, y, { align: "right" });
    y += 16;
    hr();
    y += 16;

    // ── Billed to ──
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#6B7280");
    doc.text("BILLED TO", margin, y);
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#111827");
    doc.text(customerName, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#4B5563");
    if (customerPhone) {
      doc.text(`Tel: ${customerPhone}`, margin, y);
      y += 12;
    }
    if (sale.customerAddress) {
      doc.text(sale.customerAddress, margin, y, { maxWidth: contentWidth });
      y += 12;
    }
    y += 8;
    hr();
    y += 16;

    // ── Items table ──
    const col = {
      item: margin,
      qty: pageWidth - margin - 130,
      price: pageWidth - margin - 85,
      total: pageWidth - margin,
    };
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor("#4B5563");
    doc.text("ITEM", col.item, y);
    doc.text("QTY", col.qty, y, { align: "right" });
    doc.text("PRICE", col.price, y, { align: "right" });
    doc.text("TOTAL", col.total, y, { align: "right" });
    y += 10;
    doc.setDrawColor("#F3F4F6");
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    for (const item of sale.items) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#111827");
      const label = item.portion === "half" ? `${item.itemName} (\u00bd)` : item.itemName;
      doc.text(label, col.item, y, { maxWidth: contentWidth - 140 });
      doc.setTextColor("#4B5563");
      doc.text(String(item.quantity), col.qty, y, { align: "right" });
      doc.text(fmt(item.unitPrice), col.price, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#111827");
      doc.text(fmt(item.lineTotal), col.total, y, { align: "right" });
      y += rowHeight;
    }
    y += 8;
    hr();
    y += 16;

    // ── Totals ──
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#4B5563");
    doc.text("Items Total", margin, y);
    doc.setTextColor("#111827");
    doc.text(fmt(sale.itemsTotal), pageWidth - margin, y, { align: "right" });
    y += 14;

    if (sale.deliveryCharge > 0) {
      doc.setTextColor("#4B5563");
      doc.text("Delivery Charge", margin, y);
      doc.setTextColor("#111827");
      doc.text(fmt(sale.deliveryCharge), pageWidth - margin, y, { align: "right" });
      y += 14;
    }

    hr();
    y += 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor("#111827");
    doc.text("Grand Total", margin, y);
    doc.setTextColor("#10B981");
    doc.text(fmt(sale.grandTotal), pageWidth - margin, y, { align: "right" });
    y += 18;

    if (sale.paymentStatus === "Partial") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#4B5563");
      doc.text("Amount Received", margin, y);
      doc.setTextColor("#10B981");
      doc.text(fmt(sale.amountPaid), pageWidth - margin, y, { align: "right" });
      y += 14;
      doc.setTextColor("#4B5563");
      doc.text("Balance Due", margin, y);
      doc.setTextColor("#EF4444");
      doc.text(fmt(sale.balanceDue), pageWidth - margin, y, { align: "right" });
      y += 14;
    }
    y += 8;

    // ── Payment mode ──
    if (sale.paymentMode) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor("#6B7280");
      doc.text(`Payment via ${sale.paymentMode.toUpperCase()}`, margin, y);
      y += 20;
    }

    // ── Notes ──
    if (sale.notes) {
      doc.setFontSize(8);
      doc.setTextColor("#6B7280");
      doc.text("NOTES", margin, y);
      y += 12;
      doc.setFontSize(9);
      doc.setTextColor("#374151");
      doc.text(sale.notes, margin, y, { maxWidth: contentWidth });
      y += 24;
    }

    hr();
    y += 20;

    // ── Footer ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#111827");
    doc.text("Thank you!", pageWidth / 2, y, { align: "center" });
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#6B7280");
    doc.text("We hope you enjoy your meal \u00b7 Restro Rasoi", pageWidth / 2, y, {
      align: "center",
    });

    return doc.output("blob");
  } catch (err) {
    console.error("Receipt PDF generation failed", err);
    return null;
  }
}

/**
 * Starts (or returns the existing) PDF generation for a sale. Safe to call
 * multiple times for the same sale — subsequent calls just return the
 * cached promise instead of regenerating.
 */
export function captureReceiptFor(sale: Sale): Promise<Blob | null> {
  const existing = pdfCache.get(sale._id);
  if (existing) return existing;

  const promise = buildReceiptPdf(sale);
  pdfCache.set(sale._id, promise);
  return promise;
}

/** Drop a cached PDF, e.g. after the sale has been edited and the old one is stale. */
export function invalidateReceiptCapture(saleId: string) {
  pdfCache.delete(saleId);
}

/** Peek without starting a new generation — returns undefined if nothing is cached yet. */
export function getCachedReceiptCapture(saleId: string): Promise<Blob | null> | undefined {
  return pdfCache.get(saleId);
}