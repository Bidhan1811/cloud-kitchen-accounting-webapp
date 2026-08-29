"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { useCreateAdjustment } from "../hooks/useLedger";
import type { LedgerAdjustmentType } from "../types/ledger.types";

interface AdjustmentFormProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export function AdjustmentForm(props: AdjustmentFormProps) {
  const { open, onClose, customerId, customerName } = props;
  const [amount, setAmount] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<LedgerAdjustmentType>("CREDIT");
  const [reason, setReason] = useState("");
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { mutate, isPending } = useCreateAdjustment(customerId);

  const reset = () => {
    setAmount("");
    setAdjustmentType("CREDIT");
    setReason("");
    setTransactionDate(new Date().toISOString().slice(0, 10));
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0 || !reason.trim()) return;

    mutate(
      { amount: numAmount, adjustmentType, reason: reason.trim(), transactionDate },
      { onSuccess: handleClose }
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Adjustment" subtitle={customerName}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">Adjustment Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentType("DEBIT")}
              className={cn(
                "px-4 py-3 rounded-[14px] text-[13px] font-[600] border transition-colors text-left",
                adjustmentType === "DEBIT"
                  ? "bg-[rgba(192,82,74,0.10)] border-[#C0524A] text-[#C0524A]"
                  : "bg-white/50 border-[rgba(30,20,10,0.08)] text-[#6B5D50]"
              )}
            >
              Debit
              <span className="block text-[11px] font-[400] mt-0.5 opacity-80">Increases balance owed</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType("CREDIT")}
              className={cn(
                "px-4 py-3 rounded-[14px] text-[13px] font-[600] border transition-colors text-left",
                adjustmentType === "CREDIT"
                  ? "bg-[rgba(76,154,110,0.10)] border-[#4C9A6E] text-[#4C9A6E]"
                  : "bg-white/50 border-[rgba(30,20,10,0.08)] text-[#6B5D50]"
              )}
            >
              Credit
              <span className="block text-[11px] font-[400] mt-0.5 opacity-80">Reduces balance owed</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">Amount</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input-field w-full"
            autoFocus
          />
        </div>

        <div>
          <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">Date</label>
          <input
            type="date"
            required
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="text-[12px] font-[500] text-[#6B5D50] mb-1.5 block">
            Reason <span className="text-[#C0524A]">*</span>
          </label>
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incorrect charge on Aug 12"
            rows={3}
            className="input-field w-full resize-none"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth loading={isPending}>
            Add Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}