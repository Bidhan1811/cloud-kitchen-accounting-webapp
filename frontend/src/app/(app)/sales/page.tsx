"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { SalesTable } from "@/features/sales/components/SalesTable";
import { SaleFilters } from "@/features/sales/components/SaleFilters";
import { SaleDrawer } from "@/features/sales/components/SaleDrawer";
import { SaleDetail } from "@/features/sales/components/SaleDetail";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSales, useDeleteSale } from "@/features/sales/hooks/useSales";
import { useDebounce } from "@/hooks";
import type { Sale } from "@/features/sales/types/sale.types";
import { MobileSearchFilterBar } from "@/components/mobile/MobileSearchFilterBar";

export default function SalesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [datePreset, setDatePreset] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinAmount = useDebounce(minAmount, 300);
  const debouncedMaxAmount = useDebounce(maxAmount, 300);

  const { data, isLoading } = useSales({
    search: debouncedSearch,
    status,
    paymentMode,
    ...(datePreset !== "all" && { datePreset }),
    startDate,
    endDate,
    minAmount: debouncedMinAmount === "" ? undefined : Number(debouncedMinAmount),
    maxAmount: debouncedMaxAmount === "" ? undefined : Number(debouncedMaxAmount),
    page,
    limit: 10,
  });
  const { mutateAsync: deleteSale, isPending: isDeleting } = useDeleteSale();

  const sales = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <PageHeader
        title="Sales"
        subtitle="Manage your daily orders"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            Add Sale
          </Button>
        }
      />

      <div className="hidden md:block">
        <SaleFilters
          search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          status={status} onStatusChange={(v) => { setStatus(v); setPage(1); }}
          paymentMode={paymentMode} onPaymentModeChange={(v) => { setPaymentMode(v); setPage(1); }}
          datePreset={datePreset} onDatePresetChange={(v) => { setDatePreset(v); setPage(1); }}
          startDate={startDate} onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
          endDate={endDate} onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
          minAmount={minAmount} onMinAmountChange={(v) => { setMinAmount(v); setPage(1); }}
          maxAmount={maxAmount} onMaxAmountChange={(v) => { setMaxAmount(v); setPage(1); }}
        />
      </div>

      <div className="md:hidden mb-4">
        <MobileSearchFilterBar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onFilterClick={() => { /* open filter drawer in future */ }}
        />
      </div>

      <div className="glass-card p-1 overflow-hidden md:p-1 max-md:bg-transparent max-md:border-none max-md:shadow-none max-md:p-0">
        <SalesTable
          data={sales}
          isLoading={isLoading}
          onAdd={() => setDrawerOpen(true)}
          onView={setViewingSale}
          onEdit={(sale) => { setSelectedSale(sale); setDrawerOpen(true); }}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      {/* Add/Edit Drawer */}
      <SaleDrawer
        open={drawerOpen}
        sale={selectedSale}
        onClose={() => { setDrawerOpen(false); setSelectedSale(null); }}
      />

      {/* Detail view */}
      <AnimatePresence>
        {viewingSale && (
          <>
            <div
              className="fixed inset-0 z-[50] bg-[rgba(30,20,10,0.15)] backdrop-blur-[3px]"
              onClick={() => setViewingSale(null)}
            />
            <SaleDetail
              sale={viewingSale}
              onClose={() => setViewingSale(null)}
              onEdit={() => { setSelectedSale(viewingSale); setViewingSale(null); setDrawerOpen(true); }}
              onDelete={() => { setDeleteId(viewingSale._id); setViewingSale(null); }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation — triggered from the detail view's Delete button */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) await deleteSale(deleteId);
          setDeleteId(null);
        }}
        title="Remove this sale?"
        description="This will permanently delete the sale record. This can't be undone."
        loading={isDeleting}
      />
    </motion.div>
  );
}