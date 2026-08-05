"use client";

import React, { useState } from "react";
import { Filter } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { useIsMobile } from "@/hooks";
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
  /** Controlled open state — when provided, the component acts in controlled mode */
  open?: boolean;
  /** Called when the drawer should open or close in controlled mode */
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
  const isMobile = useIsMobile();

  // Support both controlled (from parent) and uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const drawerOpen = isControlled ? controlledOpen : internalOpen;
  const setDrawerOpen = (val: boolean) => {
    if (!isControlled) setInternalOpen(val);
    onOpenChange?.(val);
  };

  const [draftFilters, setDraftFilters] = useState({
    status, paymentMode, datePreset, startDate, endDate, minAmount, maxAmount
  });

  React.useEffect(() => {
    if (drawerOpen) {
      setDraftFilters({ status, paymentMode, datePreset, startDate, endDate, minAmount, maxAmount });
    }
  }, [drawerOpen, status, paymentMode, datePreset, startDate, endDate, minAmount, maxAmount]);

  const handleApply = () => {
    onStatusChange(draftFilters.status);
    onPaymentModeChange(draftFilters.paymentMode);
    onDatePresetChange(draftFilters.datePreset);
    onStartDateChange(draftFilters.startDate);
    onEndDateChange(draftFilters.endDate);
    onMinAmountChange(draftFilters.minAmount);
    onMaxAmountChange(draftFilters.maxAmount);
    setDrawerOpen(false);
  };

  const handleClear = () => {
    setDraftFilters({ status: "", paymentMode: "", datePreset: "all", startDate: "", endDate: "", minAmount: "", maxAmount: "" });
    onStatusChange("");
    onPaymentModeChange("");
    onDatePresetChange("all");
    onStartDateChange("");
    onEndDateChange("");
    onMinAmountChange("");
    onMaxAmountChange("");
    setDrawerOpen(false);
  };

  // Shared filter fields — rendered inside both desktop Drawer and mobile BottomDrawer
  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* Status & Payment */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] text-[#6B5D50] mb-2 font-[500]">Status</label>
          <select
            value={draftFilters.status}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[13px] text-[#6B5D50] mb-2 font-[500]">Payment Mode</label>
          <select
            value={draftFilters.paymentMode}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
            className="input cursor-pointer"
          >
            {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="h-px bg-[rgba(255,255,255,0.40)] w-full" />

      {/* Dates */}
      <div>
        <label className="block text-[13px] text-[#6B5D50] mb-3 font-[500]">Date Range</label>
        <div className="glass-input flex p-[4px] gap-[2px] rounded-[14px] items-center mb-4">
          {DATE_PRESETS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDraftFilters(prev => ({ ...prev, datePreset: d.value }))}
              className={cn(
                "flex-1 py-2 rounded-[10px] text-[12px] font-[500] transition-all",
                draftFilters.datePreset === d.value
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
            value={draftFilters.startDate}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="input flex-1 text-[13px]"
          />
          <span className="text-[#9E8E80] text-[12px]">to</span>
          <input
            type="date"
            value={draftFilters.endDate}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="input flex-1 text-[13px]"
          />
        </div>
      </div>

      <div className="h-px bg-[rgba(255,255,255,0.40)] w-full" />

      {/* Amounts */}
      <div>
        <label className="block text-[13px] text-[#6B5D50] mb-3 font-[500]">Amount Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={draftFilters.minAmount}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, minAmount: e.target.value ? Number(e.target.value) : "" }))}
            className="input flex-1 text-[13px]"
          />
          <span className="text-[#9E8E80] text-[12px]">-</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={draftFilters.maxAmount}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, maxAmount: e.target.value ? Number(e.target.value) : "" }))}
            className="input flex-1 text-[13px]"
          />
        </div>
      </div>

      {/* Action buttons — only for desktop Drawer (mobile uses MobileBottomDrawer footer prop) */}
      {!isMobile && (
        <div className="pt-2 pb-2 flex gap-3">
          <Button variant="secondary" fullWidth onClick={handleClear}>Clear All</Button>
          <Button fullWidth onClick={handleApply}>Apply</Button>
        </div>
      )}
    </div>
  );

  return (
    <div className={isControlled ? "contents" : "flex items-center gap-2 mb-5"}>
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
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 h-[38px] px-4 rounded-full bg-[var(--glass-input)] backdrop-blur-md border border-[var(--glass-border)] outline-none hover:border-[var(--accent)] text-[13px] text-[var(--text-primary)] font-[500] transition-colors"
        >
          <Filter size={14} className="text-[#C8873A]" />
          Filters
        </button>
      )}

      {/* Desktop: side drawer */}
      {!isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Filters"
          subtitle="Refine your sales data"
        >
          {filterContent}
        </Drawer>
      )}

      {/* Mobile: bottom sheet — consistent with expenditure page */}
      <MobileBottomDrawer
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        subtitle="Refine your sales data"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" fullWidth onClick={handleClear}>Clear All</Button>
            <Button fullWidth onClick={handleApply}>Apply</Button>
          </div>
        }
      >
        {filterContent}
      </MobileBottomDrawer>
    </div>
  );
}
