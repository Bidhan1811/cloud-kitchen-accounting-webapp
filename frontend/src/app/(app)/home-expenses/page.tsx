"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { SearchInput } from "@/components/ui/SearchInput";
import { HomeExpenditureTable } from "@/features/home-expenditure/components/HomeExpenditureTable";
import { HomeExpenseStats } from "@/features/home-expenditure/components/HomeExpenseStats";
import {
  HomeExpenseForm,
  type HomeExpenseFormData,
} from "@/features/home-expenditure/components/HomeExpenseForm";
import {
  useHomeExpenditures,
  useCreateHomeExpenditure,
} from "@/features/home-expenditure/hooks/useHomeExpenditures";
import { useDebounce, useIsMobile } from "@/hooks";
import { HOME_EXPENSE_CATEGORIES } from "@/constants/lookups";
import { MobileSearchFilterBar } from "@/components/mobile/MobileSearchFilterBar";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { cn } from "@/utils/cn";
import { PageStatCard } from "@/components/common/PageStatCard";
import { formatCurrency } from "@/utils/formatCurrency";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

export default function HomeExpensesPage() {
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

  const { data, isLoading } = useHomeExpenditures({
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

  // Stat card sub-queries (isolated to home-expenditure query keys)
  const todayData = useHomeExpenditures({ datePreset: "today", limit: 9999 });
  const weekData  = useHomeExpenditures({ datePreset: "week",  limit: 9999 });
  const monthData = useHomeExpenditures({ datePreset: "month", limit: 9999 });
  const allData   = useHomeExpenditures({ limit: 9999 });

  function sumAmounts(items: { amount: number }[] | undefined) {
    return (items ?? []).reduce((acc, e) => acc + e.amount, 0);
  }

  const todayTotal = sumAmounts(todayData.data?.data);
  const weekTotal  = sumAmounts(weekData.data?.data);
  const monthTotal = sumAmounts(monthData.data?.data);
  const allTotal   = sumAmounts(allData.data?.data);

  const { mutateAsync: createExpense, isPending } = useCreateHomeExpenditure();

  const expenses = data?.data ?? [];
  const pagination = data?.pagination;

  const filterContent = (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-[13px] text-[#6B5D50] mb-2 font-[500]">Category</label>
        <select
          value={draftFilters.category}
          onChange={(e) => setDraftFilters((prev) => ({ ...prev, category: e.target.value }))}
          className="input cursor-pointer"
        >
          <option value="">All Categories</option>
          {HOME_EXPENSE_CATEGORIES.map((c) => (
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
              onClick={() => setDraftFilters((prev) => ({ ...prev, datePreset: d.value }))}
              className={cn(
                "flex-1 py-2 rounded-[10px] text-[12px] font-[500] transition-all",
                draftFilters.datePreset === d.value
                  ? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[var(--shadow-btn)]"
                  : "text-[#9E8E80] hover:text-[var(--accent)]"
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
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            className="input flex-1 text-[13px]"
          />
          <span className="text-[#9E8E80] text-[12px]">to</span>
          <input
            type="date"
            value={draftFilters.endDate}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, endDate: e.target.value }))}
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
            onChange={(e) =>
              setDraftFilters((prev) => ({
                ...prev,
                minAmount: e.target.value ? Number(e.target.value) : "",
              }))
            }
            className="input flex-1 text-[13px]"
          />
          <span className="text-[#9E8E80] text-[12px]">-</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={draftFilters.maxAmount}
            onChange={(e) =>
              setDraftFilters((prev) => ({
                ...prev,
                maxAmount: e.target.value ? Number(e.target.value) : "",
              }))
            }
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
        title="Home Expenses"
        subtitle="Track your personal & household expenses"
        action={
          /* Use default btn-primary class so it respects light/dark theme */
          <Button leftIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            Add Expense
          </Button>
        }
      />

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {/* All Time — accent (amber/brown) */}
        <PageStatCard
          label="All Time"
          value={formatCurrency(allTotal)}
          isLoading={allData.isLoading}
          accentColor="var(--accent)"
        />
        {/* Today — soft indigo-blue */}
        <PageStatCard
          label="Today"
          value={formatCurrency(todayTotal)}
          isLoading={todayData.isLoading}
          accentColor="#7B9ED9"
        />
        {/* This Week — sage/teal */}
        <PageStatCard
          label="This Week"
          value={formatCurrency(weekTotal)}
          isLoading={weekData.isLoading}
          accentColor="#5BAD82"
        />
        {/* This Month — warm coral */}
        <PageStatCard
          label="This Month"
          value={formatCurrency(monthTotal)}
          isLoading={monthData.isLoading}
          accentColor="#C87D5A"
        />
      </div>

      {/* ── Charts / Statistics ── */}
      <HomeExpenseStats
        data={allData.data?.data ?? []}
        isLoading={allData.isLoading}
      />

      {/* Filters — Desktop */}
      <div className="hidden md:flex items-center gap-2 mb-5">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search home expenses..."
          className="flex-1 max-w-[320px]"
        />
        <button
          type="button"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex items-center gap-2 h-[38px] px-4 rounded-full bg-[var(--glass-input)] backdrop-blur-md border border-[var(--glass-border)] outline-none hover:border-[var(--accent)] text-[13px] text-[var(--text-primary)] font-[500] transition-colors"
        >
          <Filter size={14} className="text-[var(--accent)]" />
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
          subtitle="Refine your home expenses"
        >
          {filterContent}
        </Drawer>
      )}

      {/* Mobile filter drawer */}
      <MobileBottomDrawer
        open={isMobile && filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
        subtitle="Refine your home expenses"
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
      <div className="hidden md:block glass-card p-1 overflow-hidden">
        <HomeExpenditureTable
          data={expenses}
          isLoading={isLoading}
          onAdd={() => setDrawerOpen(true)}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
      <div className="md:hidden">
        <HomeExpenditureTable
          data={expenses}
          isLoading={isLoading}
          onAdd={() => setDrawerOpen(true)}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      {/* Desktop Add drawer */}
      {!isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="New Home Expense"
          subtitle="Record a personal or household expense"
        >
          <HomeExpenseForm
            isSubmitting={isPending}
            onCancel={() => setDrawerOpen(false)}
            onSubmit={async (data) => {
              await createExpense(data as Parameters<typeof createExpense>[0]);
              setDrawerOpen(false);
            }}
          />
        </Drawer>
      )}

      {/* Mobile Add drawer */}
      <MobileBottomDrawer
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Home Expense"
        subtitle="Record a personal or household expense"
      >
        <HomeExpenseForm
          isSubmitting={isPending}
          onCancel={() => setDrawerOpen(false)}
          onSubmit={async (data) => {
            await createExpense(data as Parameters<typeof createExpense>[0]);
            setDrawerOpen(false);
          }}
        />
      </MobileBottomDrawer>
    </motion.div>
  );
}
