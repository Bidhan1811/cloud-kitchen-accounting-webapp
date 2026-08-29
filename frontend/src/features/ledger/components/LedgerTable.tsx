"use client";

import React, { useState } from "react";
import { Receipt, ArrowDownCircle, FileEdit, RotateCcw, Wallet, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";
import { MobileListCard } from "@/components/mobile/MobileListCard";
import type { LedgerTransaction } from "../types/ledger.types";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

interface LedgerTableProps {
  transactions: LedgerTransaction[];
  openingBalance: number;
  onViewSale?: (saleId: string) => void;
  onDeletePayment?: (transactionId: string) => void;
  isMobile?: boolean;
}

const PARTICULARS_LABEL: Record<LedgerTransaction["type"], string> = {
  OPENING_BALANCE: "Opening Balance",
  SALE: "Order",
  PAYMENT: "Payment",
  ADJUSTMENT: "Adjustment",
  REVERSAL: "Reversal",
};

const TYPE_ICON: Record<LedgerTransaction["type"], React.ElementType> = {
  OPENING_BALANCE: Wallet,
  SALE: Receipt,
  PAYMENT: ArrowDownCircle,
  ADJUSTMENT: FileEdit,
  REVERSAL: RotateCcw,
};

function particularsText(txn: LedgerTransaction): string {
  if (txn.type === "SALE" && txn.description) return txn.description;
  if (txn.type === "PAYMENT") {
    return txn.paymentMode ? `${txn.paymentMode} Payment` : "Payment";
  }
  if (txn.type === "ADJUSTMENT") {
    return txn.description || `${txn.adjustmentType === "DEBIT" ? "Debit" : "Credit"} Adjustment`;
  }
  if (txn.type === "REVERSAL") return txn.description || "Reversal";
  return PARTICULARS_LABEL[txn.type];
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
}) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className="flex items-center justify-between px-1 pt-3 pb-1">
      <span className="text-[11px] text-[#9E8E80]">
        {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-[8px] transition-colors",
            page === 1
              ? "text-[#C8C0B8] cursor-not-allowed"
              : "text-[#6B5D50] hover:bg-[rgba(200,135,58,0.10)] hover:text-[#C8873A]"
          )}
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-[12px] font-[600] text-[#1C1410] px-1">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-[8px] transition-colors",
            page === totalPages
              ? "text-[#C8C0B8] cursor-not-allowed"
              : "text-[#6B5D50] hover:bg-[rgba(200,135,58,0.10)] hover:text-[#C8873A]"
          )}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function LedgerTable({
  transactions,
  openingBalance,
  onViewSale,
  onDeletePayment,
  isMobile = false,
}: LedgerTableProps) {
  const [page, setPage] = useState(1);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isListExpanded, setIsListExpanded] = useState(false);

  const uniqueDates = Array.from(
    new Set(transactions.map((t) => dayjs(t.transactionDate).format("D MMMM YYYY").toUpperCase()))
  );

  // Auto-reset filter if the selected date is no longer in the current month's transactions
  if (selectedDateFilter !== "ALL" && !uniqueDates.includes(selectedDateFilter)) {
    setSelectedDateFilter("ALL");
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesDate =
      selectedDateFilter === "ALL" ||
      dayjs(t.transactionDate).format("D MMMM YYYY").toUpperCase() === selectedDateFilter;
    const matchesType = selectedTypeFilter === "ALL" || t.type === selectedTypeFilter;
    const matchesSearch =
      !searchTerm || particularsText(t).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  // Reset to page 1 if transactions change (e.g. month switched)
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const paged = filteredTransactions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {transactions.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="glass-input rounded-[10px] px-3 py-1.5 text-[13px] font-[500] text-text-primary outline-none shadow-sm w-full"
            />
            <div className="flex gap-2">
              <select
                value={selectedTypeFilter}
                onChange={(e) => {
                  setSelectedTypeFilter(e.target.value);
                  setPage(1);
                  setIsListExpanded(true);
                }}
                className="glass-input rounded-[10px] px-3 py-1.5 text-[13px] font-[500] text-text-primary outline-none shadow-sm flex-1"
              >
                <option value="ALL">All Types</option>
                <option value="SALE">Orders</option>
                <option value="PAYMENT">Payments</option>
                <option value="ADJUSTMENT">Adjustments</option>
                <option value="REVERSAL">Reversals</option>
              </select>
              <select
                value={selectedDateFilter}
                onChange={(e) => {
                  setSelectedDateFilter(e.target.value);
                  setPage(1);
                  setIsListExpanded(true);
                }}
                className="glass-input rounded-[10px] px-3 py-1.5 text-[13px] font-[500] text-text-primary outline-none shadow-sm flex-1"
              >
                <option value="ALL">All Dates</option>
                {uniqueDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <p className="text-[13px] text-[#9E8E80] text-center py-8">No transactions in this period.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsListExpanded(!isListExpanded)}
              className="flex items-center justify-between glass-input rounded-[12px] px-4 py-3 shadow-sm active:scale-[0.985] transition-transform"
            >
              <span className="text-[14px] font-[600] text-text-primary">
                {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? "s" : ""}
              </span>
              <motion.div animate={{ rotate: isListExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={18} className="text-[#9E8E80]" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isListExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-3 pt-2">
                    {paged.map((txn) => {
                      const Icon = TYPE_ICON[txn.type];
                      const clickable = txn.type === "SALE" && txn.saleId && onViewSale;
                      return (
                        <MobileListCard
                          key={txn._id}
                          onClick={clickable ? () => onViewSale!(txn.saleId!) : undefined}
                          avatar={
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                txn.debit > 0
                                  ? "bg-[rgba(192,82,74,0.10)] text-[#C0524A]"
                                  : "bg-[rgba(76,154,110,0.10)] text-[#4C9A6E]"
                              )}
                            >
                              <Icon size={18} />
                            </div>
                          }
                          title={particularsText(txn)}
                          subtitle={formatDate(txn.transactionDate)}
                          trailing={
                            <div className="flex flex-col items-end gap-0.5">
                              <span
                                className={cn(
                                  "font-jetbrains font-bold text-[15px]",
                                  txn.debit > 0 ? "text-[#C0524A]" : "text-[#4C9A6E]"
                                )}
                              >
                                {txn.debit > 0 ? "+" : "−"}
                                {formatCurrency(txn.debit > 0 ? txn.debit : txn.credit)}
                              </span>
                              {/* Delete payment inline */}
                              {txn.type === "PAYMENT" && onDeletePayment && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeletePayment(txn._id);
                                  }}
                                  className="text-[10px] text-[#C0524A] hover:underline mt-0.5"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          }
                        />
                      );
                    })}

                    <Pagination
                      page={safePage}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      totalItems={filteredTransactions.length}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // Desktop table
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      {transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(158,142,128,0.15)] bg-[rgba(158,142,128,0.05)]">
          <span className="text-[14px] font-[600] text-[#1C1410] whitespace-nowrap">Transactions</span>
          <div className="flex flex-wrap items-center gap-2">
              <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="glass-input rounded-[6px] px-2.5 py-1.5 text-[12px] font-[500] text-text-primary outline-none shadow-sm flex-1 sm:w-[150px] min-w-[120px]"
            />
            <select
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setPage(1);
              }}
              className="glass-input rounded-[6px] px-2 py-1.5 text-[12px] font-[500] text-text-primary outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="SALE">Orders</option>
              <option value="PAYMENT">Payments</option>
              <option value="ADJUSTMENT">Adjustments</option>
              <option value="REVERSAL">Reversals</option>
            </select>
            <select
              value={selectedDateFilter}
              onChange={(e) => {
                setSelectedDateFilter(e.target.value);
                setPage(1);
              }}
              className="glass-input rounded-[6px] px-2 py-1.5 text-[12px] font-[500] text-text-primary outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Dates</option>
              {uniqueDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Particulars</th>
            <th className="text-right">Debit</th>
            <th className="text-right">Credit</th>
            <th className="text-right">Balance</th>
            {onDeletePayment && <th />}
          </tr>
        </thead>
        <tbody>
          {/* Opening balance row — always on page 1 */}
          {safePage === 1 && (
            <tr>
              <td className="text-[12px] text-[#9E8E80]">-</td>
              <td className="text-[13px] font-[600] text-[#1C1410]">Opening Balance</td>
              <td className="text-right font-mono text-[13px]">-</td>
              <td className="text-right font-mono text-[13px]">-</td>
              <td className="text-right font-mono text-[13px] font-[600]">{formatCurrency(openingBalance)}</td>
              {onDeletePayment && <td />}
            </tr>
          )}
          {paged.map((txn) => {
            const clickable = txn.type === "SALE" && txn.saleId && onViewSale;
            return (
              <tr
                key={txn._id}
                className={cn(
                  "transition-colors",
                  clickable && "cursor-pointer hover:bg-[rgba(200,135,58,0.04)]"
                )}
                onClick={clickable ? () => onViewSale!(txn.saleId!) : undefined}
              >
                <td className="text-[12px] text-[#9E8E80]">{formatDate(txn.transactionDate)}</td>
                <td className="text-[13px] text-[#1C1410]">
                  <span className={cn(clickable && "text-[#C8873A] font-[600] hover:underline")}>
                    {particularsText(txn)}
                  </span>
                </td>
                <td className="text-right font-mono text-[13px] text-[#C0524A]">
                  {txn.debit > 0 ? formatCurrency(txn.debit) : "-"}
                </td>
                <td className="text-right font-mono text-[13px] text-[#4C9A6E]">
                  {txn.credit > 0 ? formatCurrency(txn.credit) : "-"}
                </td>
                <td className="text-right font-mono text-[13px] font-[600]">
                  {formatCurrency(txn.runningBalance)}
                </td>
                {onDeletePayment && (
                  <td className="text-right">
                    {txn.type === "PAYMENT" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePayment(txn._id);
                        }}
                        className="text-[11px] text-[#C0524A] hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredTransactions.length === 0 && (
        <p className="text-[13px] text-[#9E8E80] text-center py-8">No transactions found for the selected period.</p>
      )}

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filteredTransactions.length}
      />
    </div>
  );
}