"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { SearchInput } from "@/components/ui/SearchInput";
import { ExpenditureTable } from "@/features/expenditure/components/ExpenditureTable";
import { ExpenseForm } from "@/features/expenditure/components/ExpenseForm";
import { useExpenditures, useCreateExpenditure } from "@/features/expenditure/hooks/useExpenditures";
import { useDebounce, useIsMobile } from "@/hooks";
import { EXPENSE_CATEGORIES } from "@/constants/lookups";
import { MobileSearchFilterBar } from "@/components/mobile/MobileSearchFilterBar";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";

export default function ExpenditurePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinAmount = useDebounce(minAmount, 300);
  const debouncedMaxAmount = useDebounce(maxAmount, 300);
  const isMobile = useIsMobile();

  const { data, isLoading } = useExpenditures({
    search: debouncedSearch,
    category,
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

  const filterContent = (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-[13px] text-[#6B5D50] mb-2 font-[500]">Category</label>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
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
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="input flex-1 text-[13px]"
          />
          <span className="text-[#9E8E80] text-[12px]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
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
            value={minAmount}
            onChange={(e) => { setMinAmount(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
            className="input flex-1 text-[13px]"
          />
          <span className="text-[#9E8E80] text-[12px]">-</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={maxAmount}
            onChange={(e) => { setMaxAmount(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
            className="input flex-1 text-[13px]"
          />
        </div>
      </div>
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
          <Button leftIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            Add Expense
          </Button>
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
          <Button fullWidth onClick={() => setFilterDrawerOpen(false)}>Apply Filters</Button>
        }
      >
        {filterContent}
      </MobileBottomDrawer>

      {/* Expense list */}
      <div className="glass-card p-1 overflow-hidden md:p-1 max-md:bg-transparent max-md:border-none max-md:shadow-none max-md:p-0">
        <ExpenditureTable
          data={expenses}
          isLoading={isLoading}
          onAdd={() => setDrawerOpen(true)}
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
          onClose={() => setDrawerOpen(false)}
          title="New Expense"
          subtitle="Record a kitchen expense"
        >
          <ExpenseForm
            isSubmitting={isPending}
            onCancel={() => setDrawerOpen(false)}
            onSubmit={async (data) => {
              await createExpense(data as Parameters<typeof createExpense>[0]);
              setDrawerOpen(false);
            }}
          />
        </Drawer>
      )}

      {/* Mobile Add Expense drawer */}
      <MobileBottomDrawer
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Expense"
        subtitle="Record a kitchen expense"
      >
        <ExpenseForm
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
