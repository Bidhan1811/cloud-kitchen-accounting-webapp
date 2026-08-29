"use client";

import React from "react";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatCurrency";
import type { LedgerBalance } from "../types/ledger.types";

interface LedgerBalanceCardProps {
  balance: LedgerBalance;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Renders the ledger balance per spec section 2 — a negative calculated
 * balance is NEVER shown as "Outstanding". The backend already resolves
 * the label/sign via describeBalance() in ledger.service.js, so this
 * component just trusts and displays what it's given rather than
 * re-deriving the label from the raw number itself.
 */
export function LedgerBalanceCard({ balance, rightAction, className }: LedgerBalanceCardProps) {
  return (
    <div
      className={cn(
        "glass-card px-5 py-4 flex items-center justify-between gap-4",
        balance.isSettled && "opacity-90",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-wide font-[500] text-[#9E8E80]">
          {balance.label}
        </p>
        <p
          className={cn(
            "font-mono text-[24px] font-[700]",
            balance.isAdvance && "text-[#4C9A6E]",
            !balance.isAdvance && !balance.isSettled && "text-[#C0524A]",
            balance.isSettled && "text-[#1C1410]"
          )}
        >
          {formatCurrency(balance.amount)}
        </p>
      </div>

      {rightAction && <div>{rightAction}</div>}
    </div>
  );
}