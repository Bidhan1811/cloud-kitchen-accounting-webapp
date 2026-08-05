"use client";

import React, { useState, useRef } from "react";
import { Filter } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { cn } from "@/utils/cn";

interface SaleFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  paymentMode: string;
  onPaymentModeChange: (v: string) => void;
  datePreset: string;
  onDatePresetChange: (v: string) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  minAmount: number | "";
  onMinAmountChange: (v: number | "") => void;
  maxAmount: number | "";
  onMaxAmountChange: (v: number | "") => void;
  /** Controlled open state — when provided, the component acts in controlled mode (mobile) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
];

const PAYMENT_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "credit", label: "Credit" },
];

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

export function SaleFilters({
  search, onSearchChange,
  status, onStatusChange,
  paymentMode, onPaymentModeChange,
  datePreset, onDatePresetChange,
  startDate, onStartDateChange,
  endDate, onEndDateChange,
  minAmount, onMinAmountChange,
  maxAmount, onMaxAmountChange,
  open: controlledOpen,
  onOpenChange,
}: SaleFiltersProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const drawerOpen = isControlled ? controlledOpen! : internalOpen;

  // Local draft state — only committed to parent on Apply
  const [draft, setDraft] = useState({
    status, paymentMode, datePreset, startDate, endDate, minAmount, maxAmount,
  });

  // Always-fresh ref so Apply/Clear never read stale draft
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const openDrawer = () => {
    // Sync draft from current parent state when opening
    setDraft({ status, paymentMode, datePreset, startDate, endDate, minAmount, maxAmount });
    if (isControlled) {
      onOpenChange?.(true);
    } else {
      setInternalOpen(true);
    }
  };

  const closeDrawer = () => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
  };

  // Sync draft to current applied values whenever drawer opens
  React.useEffect(() => {
    if (drawerOpen) {
      setDraft({ status, paymentMode, datePreset, startDate, endDate, minAmount, maxAmount });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  // Apply reads from ref — always gets the latest draft regardless of closure age
  const handleApply = () => {
    const d = draftRef.current;
    onStatusChange(d.status);
    onPaymentModeChange(d.paymentMode);
    onDatePresetChange(d.datePreset);
    onStartDateChange(d.startDate);
    onEndDateChange(d.endDate);
    onMinAmountChange(d.minAmount);
    onMaxAmountChange(d.maxAmount);
    closeDrawer();
  };

  const handleClear = () => {
    const cleared = {
      status: "", paymentMode: "", datePreset: "all",
      startDate: "", endDate: "", minAmount: "" as const, maxAmount: "" as const,
    };
    setDraft(cleared);
    draftRef.current = cleared;
    onStatusChange("");
    onPaymentModeChange("");
    onDatePresetChange("all");
    onStartDateChange("");
    onEndDateChange("");
    onMinAmountChange("");
    onMaxAmountChange("");
    closeDrawer();
  };

  // Shared filter UI fields
  const filterFields = (
    <div className="flex flex-col gap-5">
      {/* Status & Payment */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] text-[#6B5D50] mb-2 font-[500]">Status</label>
          <select
            value={draft.status}
            onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value }))}
            className="input cursor-pointer w-full"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[13px] text-[#6B5D50] mb-2 font-[500]">Payment Mode</label>
          <select
            value={draft.paymentMode}
            onChange={(e) => setDraft((prev) => ({ ...prev, paymentMode: e.target.value }))}
            className="input cursor-pointer w-full"
          >
            {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="h-px bg-[rgba(0,0,0,0.08)] w-full" />

      {/* Date Range */}
      <div>
        <label className="block text-[13px] text-[#6B5D50] mb-3 font-[500]">Date Range</label>
        <div className="glass-input flex p-[4px] gap-[2px] rounded-[14px] items-center mb-3">
          {DATE_PRESETS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, datePreset: d.value }))}
              className={cn(
                "flex-1 py-2 rounded-[10px] text-[12px] font-[500] transition-all",
                draft.datePreset === d.value
                  ? "bg-[#C8873A] text-white shadow-[0_2px_8px_rgba(200,135,58,0.25)]"
                  : "text-[#9E8E80] hover:text-[#6B5D50]"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
            className="input flex-1 text-[13px]"
          />
          <span className="text-[#9E8E80] text-[12px]">to</span>
          <input
            type="date"
            value={draft.endDate}
            onChange={(e) => setDraft((prev) => ({ ...prev, endDate: e.target.value }))}
            className="input flex-1 text-[13px]"
          />
        </div>
      </div>

      <div className="h-px bg-[rgba(0,0,0,0.08)] w-full" />

      {/* Amount Range */}
      <div>
        <label className="block text-[13px] text-[#6B5D50] mb-3 font-[500]">Amount Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={draft.minAmount}
            onChange={(e) => setDraft((prev) => ({ ...prev, minAmount: e.target.value ? Number(e.target.value) : "" }))}
            className="input flex-1 text-[13px]"
          />
          <span className="text-[#9E8E80] text-[12px]">—</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={draft.maxAmount}
            onChange={(e) => setDraft((prev) => ({ ...prev, maxAmount: e.target.value ? Number(e.target.value) : "" }))}
            className="input flex-1 text-[13px]"
          />
        </div>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex gap-3 w-full">
      <Button variant="secondary" fullWidth onClick={handleClear}>Clear All</Button>
      <Button fullWidth onClick={handleApply}>Apply Filters</Button>
    </div>
  );

  return (
    <div className={isControlled ? "contents" : "flex items-center gap-2 mb-5"}>
      {/* Desktop search + filter button */}
      {!isControlled && (
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search invoice, customer..."
          className="flex-1 max-w-[320px]"
        />
      )}

      {!isControlled && (
        <button
          type="button"
          onClick={openDrawer}
          className="flex items-center gap-2 h-[38px] px-4 rounded-full bg-[var(--glass-input)] backdrop-blur-md border border-[var(--glass-border)] outline-none hover:border-[var(--accent)] text-[13px] text-[var(--text-primary)] font-[500] transition-colors"
        >
          <Filter size={14} className="text-[#C8873A]" />
          Filters
        </button>
      )}

      {/* Desktop side Drawer — only in uncontrolled mode */}
      {!isControlled && (
        <Drawer
          open={drawerOpen}
          onClose={closeDrawer}
          title="Filters"
          subtitle="Refine your sales data"
        >
          <div className="flex flex-col gap-5">
            {filterFields}
            <div className="pt-2 flex gap-3">
              {actionButtons}
            </div>
          </div>
        </Drawer>
      )}

      {/* Mobile bottom sheet — only in controlled mode */}
      {isControlled && (
        <MobileBottomDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          title="Filters"
          subtitle="Refine your sales data"
          footer={actionButtons}
        >
          {filterFields}
        </MobileBottomDrawer>
      )}
    </div>
  );
}
