"use client";

import React, { useState } from "react";
import { Wallet, FileEdit, Share2, MessageCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { useIsMobile } from "@/hooks";
import { useCustomerLedgerSummary, useCustomerLedger } from "../hooks/useLedger";
import { LedgerMonthlySummary } from "./LedgerMonthlySummary";
import { LedgerTable } from "./LedgerTable";
import { PaymentForm } from "./PaymentForm";
import { AdjustmentForm } from "./AdjustmentForm";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { generateStatementXlsx } from "../utils/excel";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Customer } from "@/features/customers/types/customer.types";

interface CustomerLedgerSectionProps {
  customer: Customer;
  onViewSale: (saleId: string) => void;
}

/**
 * Integrated directly into the Customer Detail page (spec section 28 — no
 * separate Credit Account Dashboard). Only rendered when
 * customer.isCreditCustomer is true; CustomerProfilePage is responsible for
 * that gating so this component can assume it's always relevant when
 * mounted.
 */
export function CustomerLedgerSection(props: CustomerLedgerSectionProps) {
  const { customer, onViewSale } = props;
  const isMobile = useIsMobile();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [adjustmentFormOpen, setAdjustmentFormOpen] = useState(false);

  const { data: summary, isLoading } = useCustomerLedgerSummary(customer._id, year, month);

  // Pre-fetch the full-history ledger so it's instantly available from cache.
  const { data: fullLedger } = useCustomerLedger(customer._id, undefined);

  // Pre-generate the heavy XLSX file in the background as soon as the full
  // ledger data arrives. This ensures the "Share" click is perfectly synchronous,
  // preventing NotAllowedError on strict mobile browsers, while keeping the
  // main thread free during the actual interaction.
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [isPreparingStatement, setIsPreparingStatement] = useState(false);

  const statementFileName = `${customer.name.replace(/\s+/g, "_")}-statement.xlsx`;
  const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  React.useEffect(() => {
    if (!fullLedger) return;
    let isMounted = true;
    setIsPreparingStatement(true);

    generateStatementXlsx(fullLedger)
      .then((blob) => {
        if (!isMounted) return;
        setPreparedFile(new File([blob], statementFileName, { type: XLSX_MIME }));
      })
      .catch((err) => console.error("Background statement prep failed:", err))
      .finally(() => {
        if (isMounted) setIsPreparingStatement(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fullLedger, statementFileName]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  /**
   * "View Statement" — Triggers standard download of the pre-prepared file.
   */
  const handleGenerateStatement = () => {
    if (!preparedFile) return;
    const url = URL.createObjectURL(preparedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = preparedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * "Share Statement" — Opens the native OS share sheet using the Web Share API.
   *
   * IMPORTANT: This handler must stay synchronous (no async/await). Several
   * strict mobile browsers (Samsung Internet, some Chromium Android builds)
   * track "user activation" tokens and invalidate them the moment an async
   * function suspends — even for a single microtask tick. Calling
   * navigator.share() inside an async handler therefore triggers
   * NotAllowedError: Permission denied even though the file is ready.
   *
   * Solution: keep the handler synchronous, fire navigator.share() immediately,
   * and chain .catch() on the returned promise to handle errors out-of-band.
   *
   * We also guard with navigator.canShare({ files }) first, because browsers
   * that support navigator.share for text/urls but NOT files would otherwise
   * silently fall through to a download.
   */
  const handleShareStatement = () => {
    if (!preparedFile) return;

    const shareData = {
      title: `Account Statement \u2013 ${customer.name}`,
      text: `Account statement for ${customer.name} from Restro Rasoi`,
      files: [preparedFile],
    };

    const canShareFiles =
      typeof navigator.canShare === "function" && navigator.canShare(shareData);

    if (navigator.share && canShareFiles) {
      // Call share() synchronously — do NOT await here.
      navigator.share(shareData).catch((err: unknown) => {
        const isUserCancel = err instanceof DOMException && err.name === "AbortError";
        if (!isUserCancel) {
          console.warn("Native statement share failed, falling back to download:", err);
          handleGenerateStatement();
        }
      });
      return;
    }

    handleGenerateStatement();
  };

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonCard className="h-[90px]" />
        <SkeletonCard className="h-[220px]" />
      </div>
    );
  }

  /**
   * "Send Reminder" — Composes a polite payment reminder message containing
   * the customer's exact current outstanding balance and fires the native OS
   * share sheet. The user can then target WhatsApp, SMS, or any other app.
   *
   * Defined AFTER the isLoading/!summary guard so that summary is guaranteed
   * to be non-null when the function body executes.
   *
   * Stays fully synchronous — no async/await — to preserve the browser's
   * user activation token (avoids NotAllowedError on strict mobile builds).
   */
  const handleSendReminder = () => {
    const formattedAmount = formatCurrency(summary.balance.amount);
    const reminderText =
      `Hi ${customer.name}, your current balance with Restro Rasoi is ` +
      `${formattedAmount}. Please settle at your convenience — thank you! 🙏`;

    if (navigator.share) {
      navigator.share({ text: reminderText }).catch((err: unknown) => {
        const isUserCancel = err instanceof DOMException && err.name === "AbortError";
        if (!isUserCancel) {
          console.warn("Reminder share failed:", err);
        }
      });
      return;
    }

    // Fallback for desktop: copy to clipboard so the reminder isn't lost.
    navigator.clipboard?.writeText(reminderText).catch(() => {});
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Compact Top Section: Balance + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-4">
        {/* Left: Balance Info */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-[500] text-[#9E8E80]">
              <Wallet size={12} className="text-[#C8873A]" />
              {summary.balance.label}
            </p>
            <p
              className={cn(
                "font-mono text-[24px] font-[700]",
                summary.balance.isAdvance && "text-[#4C9A6E]",
                !summary.balance.isAdvance && !summary.balance.isSettled && "text-[#C0524A]",
                summary.balance.isSettled && "text-[#1C1410]"
              )}
            >
              {formatCurrency(summary.balance.amount)}
            </p>
          </div>
          {summary.balance.label === "Outstanding" && (
            <button
              onClick={handleSendReminder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F5F2] border border-[#E5E0DB] text-[#1C1410] text-[12px] font-[500] hover:bg-[#EAE6DF] transition-colors"
            >
              <MessageCircle size={14} className="text-[#9E8E80]" />
              Reminder
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[rgba(255,255,255,0.40)]">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Wallet size={14} />}
            onClick={() => setPaymentFormOpen(true)}
            className="w-full sm:w-auto"
          >
            Record Payment
          </Button>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="secondary"
              className="w-full flex-1 sm:flex-none sm:w-auto"
              leftIcon={<FileEdit size={14} />}
              onClick={() => setAdjustmentFormOpen(true)}
            >
              Adjustment
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-full flex-1 sm:flex-none sm:w-auto"
              leftIcon={<Share2 size={14} />}
              onClick={handleShareStatement}
              loading={isPreparingStatement}
              disabled={!preparedFile || isPreparingStatement}
            >
              Statement
            </Button>
          </div>
        </div>
      </div>

      <LedgerMonthlySummary
        summary={summary}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        disableNext={isCurrentMonth}
      />

      <LedgerTable
        transactions={summary.transactions}
        openingBalance={summary.openingBalance}
        onViewSale={onViewSale}
        isMobile={isMobile}
      />

      <PaymentForm
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        customerId={customer._id}
        customerName={customer.name}
        currentBalanceAmount={summary.balance.isAdvance ? -summary.balance.amount : summary.balance.amount}
      />

      <AdjustmentForm
        open={adjustmentFormOpen}
        onClose={() => setAdjustmentFormOpen(false)}
        customerId={customer._id}
        customerName={customer.name}
      />
    </div>
  );
}