"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatCurrency";
import type { MonthlyLedgerSummary } from "../types/ledger.types";

interface LedgerMonthlySummaryProps {
  summary: MonthlyLedgerSummary;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  disableNext?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function LedgerMonthlySummary(props: LedgerMonthlySummaryProps) {
  const { summary, onPrevMonth, onNextMonth, disableNext = false } = props;

  const rows = [
    { label: "Opening Balance", value: summary.openingBalance, positive: false, negative: false },
    { label: "Credit Sales", value: summary.creditSales, positive: true, negative: false },
    { label: "Payments Received", value: summary.paymentsReceived, positive: false, negative: true },
    { label: "Debit Adjustments", value: summary.debitAdjustments, positive: true, negative: false },
    { label: "Credit Adjustments", value: summary.creditAdjustments, positive: false, negative: true },
  ].filter((row) => row.label === "Opening Balance" || row.value > 0);

  return (
    <div className="glass-card p-4 sm:px-5 sm:py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between sm:justify-start sm:gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#9E8E80] hover:bg-[rgba(30,20,10,0.06)] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-[14px] font-[600] text-[#1C1410] min-w-[100px] text-center">
            {MONTH_NAMES[summary.month - 1]} {summary.year}
          </p>
          <button
            onClick={onNextMonth}
            disabled={disableNext}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#9E8E80] hover:bg-[rgba(30,20,10,0.06)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        
        {/* Desktop Divider */}
        <div className="hidden sm:block w-px h-6 bg-[rgba(255,255,255,0.40)] mx-2" />

        {/* Desktop Horizontal Items */}
        <div className="hidden sm:flex flex-1 items-center gap-6 justify-between overflow-x-auto">
          <div className="flex gap-6">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5 whitespace-nowrap">
                <span className="text-[#6B5D50] text-[10px] uppercase tracking-wide font-[500]">{row.label}</span>
                <span
                  className={`font-mono text-[13px] font-[600] ${
                    row.positive ? "text-[#C0524A]" : row.negative ? "text-[#4C9A6E]" : "text-[#1C1410]"
                  }`}
                >
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 border-l border-[rgba(255,255,255,0.40)] pl-4">
            <span className="text-[#6B5D50] text-[11px] uppercase tracking-wide font-[600]">Closing</span>
            <span className={cn(
              "font-mono text-[14px] font-[700]",
              summary.balance.isAdvance ? "text-[#4C9A6E]" : "text-[#1C1410]"
            )}>
              {summary.balance.isAdvance ? "Advance " : ""}
              {formatCurrency(summary.balance.amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Vertical Items */}
      <div className="flex flex-col gap-2 sm:hidden">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-[13px]">
            <span className="text-[#6B5D50]">{row.label}</span>
            <span
              className={`font-mono font-[600] ${
                row.positive ? "text-[#C0524A]" : row.negative ? "text-[#4C9A6E]" : "text-[#1C1410]"
              }`}
            >
              {formatCurrency(row.value)}
            </span>
          </div>
        ))}

        <div className="h-px bg-[rgba(255,255,255,0.40)] my-1" />

        <div className="flex justify-between text-[14px] font-[700]">
          <span>Closing Balance</span>
          <span className={summary.balance.isAdvance ? "text-[#4C9A6E]" : "text-[#1C1410]"}>
            {summary.balance.isAdvance ? "Advance " : ""}
            {formatCurrency(summary.balance.amount)}
          </span>
        </div>
      </div>
    </div>
  );
}