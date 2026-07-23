"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { SearchInput } from "@/components/ui/SearchInput";
import { ExpenditureTable } from "@/features/expenditure/components/ExpenditureTable";
import { ExpenseForm, type ExpenseFormData } from "@/features/expenditure/components/ExpenseForm";
import { useExpenditures, useCreateExpenditure } from "@/features/expenditure/hooks/useExpenditures";
import { useDebounce, useIsMobile } from "@/hooks";
import { EXPENSE_CATEGORIES } from "@/constants/lookups";
import { MobileSearchFilterBar } from "@/components/mobile/MobileSearchFilterBar";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { VoiceMicButton } from "@/features/voice/components/VoiceMicButton";
import type { VoiceParseResult } from "@/features/voice/services/voice.service";
import { cn } from "@/utils/cn";

interface VoiceExpenseExtract {
  category?: string | null;
  items?: string | null;
  amount?: number | null;
  paymentMode?: string | null;
  notes?: string | null;
}

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

export default function ExpenditurePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [datePreset, setDatePreset] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinAmount = useDebounce(minAmount, 300);
  const debouncedMaxAmount = useDebounce(maxAmount, 300);
  const isMobile = useIsMobile();

  const [draftFilters, setDraftFilters] = useState({
    category,
    datePreset,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  });

  React.useEffect(() => {
    if (filterDrawerOpen) {
      setDraftFilters({ category, datePreset, startDate, endDate, minAmount, maxAmount });
    }
  }, [filterDrawerOpen, category, datePreset, startDate, endDate, minAmount, maxAmount]);

  const handleApplyFilters = () => {
    setCategory(draftFilters.category);
    setDatePreset(draftFilters.datePreset);
    setStartDate(draftFilters.startDate);
    setEndDate(draftFilters.endDate);
    setMinAmount(draftFilters.minAmount);
    setMaxAmount(draftFilters.maxAmount);
    setPage(1);
    setFilterDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setDraftFilters({ category: "", datePreset: "all", startDate: "", endDate: "", minAmount: "", maxAmount: "" });
    setCategory("");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setPage(1);
    setFilterDrawerOpen(false);
  };

  // Voice draft — converted null to undefined for ExpenseForm defaultValues
  const [voiceDraft, setVoiceDraft] = useState<{ defaultValues: Partial<ExpenseFormData>; transcript: string } | null>(null);

  const { data, isLoading } = useExpenditures({
    search: debouncedSearch,
    category,
    ...(datePreset !== "all" && { datePreset }),
    startDate,
    endDate,
    minAmount: debouncedMinAmount === "" ? undefined : Number(debouncedMinAmount),
    maxAmount: debouncedMaxAmount === "" ? undefined : Number(debouncedMaxAmount),
    page,
    limit: 10,
  });
  const { mutateAsync: createExpense, isPending } = useCreateExpenditure();

  const expenses = data?.data ?? [];
  const pagination = data?.pagination;

  const handleVoiceResult = (result: VoiceParseResult<VoiceExpenseExtract>) => {
    const { category, items, amount, paymentMode, notes } = result.extracted;
    setVoiceDraft({
      defaultValues: {
        category: category ?? undefined,
        items: items ?? undefined,
        amount: amount ?? undefined,
        paymentMode: paymentMode ?? undefined,
        notes: notes ?? undefined,
      },
      transcript: result.transcript,
    });
    setDrawerOpen(true);
  };

  const filterContent = (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-[13px] text-[#6B5D50] mb-2 font-[500]">Category</label>
        <select
          value={draftFilters.category}
          onChange={(e) => setDraftFilters(prev => ({ ...prev, category: e.target.value }))}
          className="input cursor-pointer"
        >
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="h-px bg-[rgba(255,255,255,0.40)] w-full" />

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
      
      {!isMobile && (
        <div className="pt-2 flex gap-3">
          <Button variant="secondary" fullWidth onClick={handleClearFilters}>Clear All</Button>
          <Button fullWidth onClick={handleApplyFilters}>Apply Filters</Button>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <PageHeader
        title="Expenditure"
        subtitle="Track your kitchen expenses"
        action={
          <div className="flex items-center gap-2">
            <VoiceMicButton<VoiceExpenseExtract> context="expense" onResult={handleVoiceResult} />
            <Button leftIcon={<Plus size={16} />} onClick={() => { setVoiceDraft(null); setDrawerOpen(true); }}>
              Add Expense
            </Button>
          </div>
        }
      />

      {/* Filters — Desktop */}
      <div className="hidden md:flex items-center gap-2 mb-5">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search expenses..."
          className="flex-1 max-w-[320px]"
        />
        <button
          type="button"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex items-center gap-2 h-[38px] px-4 rounded-full bg-[var(--glass-input)] backdrop-blur-md border border-[var(--glass-border)] outline-none hover:border-[var(--accent)] text-[13px] text-[var(--text-primary)] font-[500] transition-colors"
        >
          <Filter size={14} className="text-[#C8873A]" />
          Filters
        </button>
      </div>

      {/* Filters — Mobile */}
      <div className="md:hidden mb-4">
        <MobileSearchFilterBar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onFilterClick={() => setFilterDrawerOpen(true)}
        />
      </div>

      {/* Desktop filter drawer */}
      {!isMobile && (
        <Drawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          title="Filters"
          subtitle="Refine your expenses data"
        >
          {filterContent}
        </Drawer>
      )}

      {/* Mobile filter drawer */}
      <MobileBottomDrawer
        open={isMobile && filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
        subtitle="Refine your expenses data"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" fullWidth onClick={handleClearFilters}>Clear All</Button>
            <Button fullWidth onClick={handleApplyFilters}>Apply</Button>
          </div>
        }
      >
        {filterContent}
      </MobileBottomDrawer>

      {/* Expense list */}
      <div className="glass-card p-1 overflow-hidden md:p-1 max-md:bg-transparent max-md:border-none max-md:shadow-none max-md:p-0">
        <ExpenditureTable
          data={expenses}
          isLoading={isLoading}
          onAdd={() => { setVoiceDraft(null); setDrawerOpen(true); }}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      {/* Desktop Add Expense drawer */}
      {!isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setVoiceDraft(null); }}
          title="New Expense"
          subtitle="Record a kitchen expense"
        >
          {voiceDraft?.transcript && (
            <div className="glass-card p-3 text-[12px] text-[#6B5D50] flex flex-col gap-1 mb-4">
              <span className="uppercase tracking-wide text-[10px] font-[600] text-[#9E8E80]">You said</span>
              <span className="italic">"{voiceDraft.transcript}"</span>
              <span className="text-[11px] text-[#9E8E80] mt-1">
                Review the fields below before saving — voice entry isn't always perfect.
              </span>
            </div>
          )}
          <ExpenseForm
            key={voiceDraft ? "voice" : "new"}
            defaultValues={voiceDraft?.defaultValues}
            isSubmitting={isPending}
            onCancel={() => { setDrawerOpen(false); setVoiceDraft(null); }}
            onSubmit={async (data) => {
              await createExpense(data as Parameters<typeof createExpense>[0]);
              setDrawerOpen(false);
              setVoiceDraft(null);
            }}
          />
        </Drawer>
      )}

      {/* Mobile Add Expense drawer */}
      <MobileBottomDrawer
        open={isMobile && drawerOpen}
        onClose={() => { setDrawerOpen(false); setVoiceDraft(null); }}
        title="New Expense"
        subtitle="Record a kitchen expense"
      >
        {voiceDraft?.transcript && (
          <div className="glass-card p-3 text-[12px] text-[#6B5D50] flex flex-col gap-1 mb-4">
            <span className="uppercase tracking-wide text-[10px] font-[600] text-[#9E8E80]">You said</span>
            <span className="italic">"{voiceDraft.transcript}"</span>
            <span className="text-[11px] text-[#9E8E80] mt-1">
              Review the fields below before saving — voice entry isn't always perfect.
            </span>
          </div>
        )}
        <ExpenseForm
          key={voiceDraft ? "voice" : "new"}
          defaultValues={voiceDraft?.defaultValues}
          isSubmitting={isPending}
          onCancel={() => { setDrawerOpen(false); setVoiceDraft(null); }}
          onSubmit={async (data) => {
            await createExpense(data as Parameters<typeof createExpense>[0]);
            setDrawerOpen(false);
            setVoiceDraft(null);
          }}
        />
      </MobileBottomDrawer>
    </motion.div>
  );
}