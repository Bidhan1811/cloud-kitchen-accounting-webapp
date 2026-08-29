"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";
import { useCreatePayment } from "../hooks/useLedger";
import { formatCurrency } from "@/utils/formatCurrency";
import type { LedgerPaymentMode, LedgerApiError } from "../types/ledger.types";

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  currentBalanceAmount: number;
}

const PAYMENT_MODES: LedgerPaymentMode[] = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];

export function PaymentForm(props: PaymentFormProps) {
  const { open, onClose, customerId, customerName, currentBalanceAmount } = props;
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<LedgerPaymentMode>("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const { mutate, isPending } = useCreatePayment(customerId);

  const reset = () => {
    setAmount("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMode("Cash");
    setReference("");
    setNotes("");
    setDuplicateWarning(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = (force: boolean) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    mutate(
      {
        amount: numAmount,
        paymentDate,
        paymentMode,
        reference: reference.trim() || undefined,
        description: notes.trim() || undefined,
        force,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: any) => {
          const apiError: LedgerApiError | undefined = err?.response?.data;
          if (apiError?.code === "DUPLICATE_PAYMENT_REFERENCE") {
            setDuplicateWarning(apiError.message);
          }
        },
      }
    );
  };

  const numAmount = Number(amount) || 0;
  const projectedBalance = currentBalanceAmount - numAmount;

  return (
    <Modal open={open} onClose={handleClose} title="Record Payment" subtitle={customerName}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">Amount</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setDuplicateWarning(null);
            }}
            placeholder="0.00"
            className="input-field w-full"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">Payment Date</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as LedgerPaymentMode)}
              className="input-field w-full"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">
            Reference / Transaction ID
            <span className="text-[#9E8E80] font-[400]"> (optional)</span>
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              setDuplicateWarning(null);
            }}
            placeholder="e.g. UPI123456"
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">
            Note <span className="text-[#9E8E80] font-[400]">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. August payment"
            className="input-field w-full"
          />
        </div>

        {numAmount > 0 && (
          <div className="glass-card px-4 py-3 flex items-center justify-between text-[13px]">
            <span className="text-[#9E8E80]">
              {projectedBalance <= 0 ? "Advance after payment" : "Balance after payment"}
            </span>
            <span
              className={`font-mono font-[600] ${
                projectedBalance <= 0 ? "text-[#4C9A6E]" : "text-[#1C1410]"
              }`}
            >
              {formatCurrency(Math.abs(projectedBalance))}
            </span>
          </div>
        )}

        {duplicateWarning && (
          <div className="rounded-[14px] bg-[rgba(200,135,58,0.10)] border border-[rgba(200,135,58,0.30)] px-4 py-3 flex gap-3">
            <AlertTriangle size={18} className="text-[#C8873A] flex-shrink-0 mt-[1px]" />
            <div className="flex flex-col gap-2">
              <p className="text-[13px] text-[#1C1410]">{duplicateWarning}</p>
              <button
                type="button"
                onClick={() => submit(true)}
                className="text-[12px] font-[600] text-[#C8873A] hover:underline w-fit"
              >
                Record anyway
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth loading={isPending}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}