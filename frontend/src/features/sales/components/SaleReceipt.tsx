"use client";

import React, { forwardRef } from "react";
import type { Sale } from "../types/sale.types";

interface SaleReceiptProps {
  sale: Sale;
}

/**
 * A print/image-quality receipt rendered with pure inline CSS.
 * This component is meant to be captured by html2canvas — it is
 * rendered off-screen (position: fixed, left: -9999px) and is
 * NOT visible to the user directly.
 */
export const SaleReceipt = forwardRef<HTMLDivElement, SaleReceiptProps>(
  ({ sale }, ref) => {
    const customerName =
      sale.customer?.name ?? sale.customerName ?? "Walk-in Customer";
    const customerPhone = sale.customer?.phone ?? sale.customerPhone;
    const date = new Date(sale.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const fmt = (n: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n);

    const statusColor =
      sale.paymentStatus === "Paid"
        ? "#2E7D52"
        : sale.paymentStatus === "Partial"
        ? "#B8862E"
        : "#C0524A";

    const statusBg =
      sale.paymentStatus === "Paid"
        ? "#E8F5EF"
        : sale.paymentStatus === "Partial"
        ? "#FEF3D5"
        : "#FDEAEA";

    return (
      <div
        ref={ref}
        style={{
          width: "100%",
          background: "#FFFFFF",
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          color: "#1F2937",
          padding: "0",
          borderRadius: "0",
          overflow: "hidden",
          boxShadow: "none",
        }}
      >
        {/* ── Brand Header ── */}
        <div
          style={{
            background: "#F9FAFB",
            borderBottom: "1px solid #E5E7EB",
            padding: "16px 20px 14px",
            textAlign: "center",
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 8px",
              fontSize: "18px",
            }}
          >
            🍽️
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "0.5px",
              lineHeight: 1,
            }}
          >
            Restro Rasoi
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "9px",
              color: "#6B7280",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Cloud Kitchen
          </p>
        </div>

        {/* ── Invoice Header ── */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "10px 20px",
            borderBottom: "1px dashed #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontWeight: 600,
              }}
            >
              Invoice
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "14px",
                fontWeight: 700,
                color: "#111827",
                fontFamily: "monospace",
              }}
            >
              {sale.invoiceId}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontWeight: 600,
              }}
            >
              Date
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "12px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {date}
            </p>
          </div>
          <div
            style={{
              background: statusBg,
              color: statusColor,
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.3px",
            }}
          >
            {sale.paymentStatus}
          </div>
        </div>

        {/* ── Customer Info ── */}
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "10px",
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              fontWeight: 600,
            }}
          >
            Billed To
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {customerName}
          </p>
          {customerPhone && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "#4B5563",
              }}
            >
              📞 {customerPhone}
            </p>
          )}
          {sale.customerAddress && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "#4B5563",
              }}
            >
              📍 {sale.customerAddress}
            </p>
          )}
        </div>

        {/* ── Items Table ── */}
        <div style={{ padding: "10px 20px" }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "10px",
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              fontWeight: 600,
            }}
          >
            Order Details
          </p>

          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 36px 70px 70px",
              gap: "4px",
              padding: "6px 8px",
              background: "#F3F4F6",
              borderRadius: "6px",
              marginBottom: "4px",
            }}
          >
            {["Item", "Qty", "Price", "Total"].map((h, i) => (
              <span
                key={h}
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#4B5563",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  textAlign: i === 0 ? "left" : "right",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Item rows */}
          {sale.items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 36px 70px 70px",
                gap: "4px",
                padding: "8px 8px",
                borderBottom: i < sale.items.length - 1 ? "1px solid #F3F4F6" : "none",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "#111827", fontWeight: 500 }}>
                  {item.itemName}
                </span>
                {item.portion === "half" && (
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#4B5563",
                      marginLeft: "4px",
                      background: "#E5E7EB",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      fontWeight: 600,
                    }}
                  >
                    ½
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: "#4B5563",
                  textAlign: "right",
                }}
              >
                {item.quantity}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "#4B5563",
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                {fmt(item.unitPrice)}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#111827",
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                {fmt(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>

        {/* ── Totals ── */}
        <div
          style={{
            margin: "0 20px 10px",
            background: "#F9FAFB",
            borderRadius: "8px",
            padding: "10px 14px",
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#4B5563" }}>Items Total</span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#111827",
                fontFamily: "monospace",
              }}
            >
              {fmt(sale.itemsTotal)}
            </span>
          </div>

          {sale.deliveryCharge > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#4B5563" }}>
                🛵 Delivery Charge
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#111827",
                  fontFamily: "monospace",
                }}
              >
                {fmt(sale.deliveryCharge)}
              </span>
            </div>
          )}

          <div
            style={{
              height: "1px",
              background: "#E5E7EB",
              margin: "8px 0",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
              Grand Total
            </span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#10B981",
                fontFamily: "monospace",
              }}
            >
              {fmt(sale.grandTotal)}
            </span>
          </div>

          {sale.paymentStatus === "Partial" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "6px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#4B5563" }}>Amount Received</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#10B981",
                    fontFamily: "monospace",
                  }}
                >
                  {fmt(sale.amountPaid)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "4px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#4B5563" }}>Balance Due</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#EF4444",
                    fontFamily: "monospace",
                  }}
                >
                  {fmt(sale.balanceDue)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Payment Info ── */}
        {sale.paymentMode && (
          <div
            style={{
              margin: "0 20px 8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              background: "#F9FAFB",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
            }}
          >
            <span style={{ fontSize: "11px", color: "#6B7280" }}>Payment via</span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#111827",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {sale.paymentMode}
            </span>
          </div>
        )}

        {/* Notes */}
        {sale.notes && (
          <div
            style={{
              margin: "0 20px 8px",
              padding: "8px 12px",
              background: "#F9FAFB",
              borderRadius: "8px",
              borderLeft: "3px solid #6B7280",
              borderRight: "1px solid #E5E7EB",
              borderTop: "1px solid #E5E7EB",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "3px",
                fontWeight: 600,
              }}
            >
              Notes
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#374151" }}>
              {sale.notes}
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <div
          style={{
            background: "#F9FAFB",
            borderTop: "1px solid #E5E7EB",
            padding: "12px 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 3px",
              fontSize: "13px",
              color: "#111827",
              fontWeight: 700,
            }}
          >
            🙏 Thank you!
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              color: "#6B7280",
              letterSpacing: "0.5px",
            }}
          >
            We hope you enjoy your meal · Restro Rasoi
          </p>
        </div>
      </div>
    );
  }
);

SaleReceipt.displayName = "SaleReceipt";
