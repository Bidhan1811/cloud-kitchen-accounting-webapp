"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingBag, TrendingUp, AlertCircle, BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { SalesTable } from "@/features/sales/components/SalesTable";
import { SaleFilters } from "@/features/sales/components/SaleFilters";
import { SaleDrawer } from "@/features/sales/components/SaleDrawer";
import { SaleDetail } from "@/features/sales/components/SaleDetail";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSales, useDeleteSale } from "@/features/sales/hooks/useSales";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { useDebounce } from "@/hooks";
import type { Sale } from "@/features/sales/types/sale.types";
import { PageStatCard } from "@/components/common/PageStatCard";
import { formatCurrency } from "@/utils/formatCurrency";
import { MobileSearchFilterBar } from "@/components/mobile/MobileSearchFilterBar";
import { VoiceMicButton } from "@/features/voice/components/VoiceMicButton";
import type { VoiceParseResult } from "@/features/voice/services/voice.service";
import { captureReceiptFor, invalidateReceiptCapture } from "@/features/sales/components/receiptCapture";

interface VoiceSaleExtract {
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  items: { itemName: string; quantity: number; unitPrice: number; halfPrice?: number; portion?: "full" | "half"; isCustom?: boolean; menuItem?: string }[];
  deliveryCharge?: number | null;
  paymentMode?: string | null;
  paymentStatus?: "Paid" | "Unpaid" | "Partial" | null;
  amountPaid?: number | null;
  notes?: string | null;
}

export default function SalesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const { summary } = useDashboard();
  const s = summary.data;
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [voiceDraft, setVoiceDraft] = useState<{ defaultValues: Partial<VoiceSaleExtract>; transcript: string } | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

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

  const handleVoiceResult = (result: VoiceParseResult<VoiceSaleExtract>) => {
    setSelectedSale(null);
    setVoiceDraft({ defaultValues: result.extracted, transcript: result.transcript });
    setDrawerOpen(true);
  };

  /**
   * Kick off the receipt image capture shortly after a row is tapped —
   * but deliberately AFTER this click handler returns, so it never
   * competes with React's own work of opening the detail drawer. Doing the
   * capture synchronously here (createRoot + html2canvas) was blocking the
   * main thread right as the drawer tried to render, which is what made
   * the drawer feel slow/late to open. Deferring it lets the drawer open
   * first; the capture still finishes well before most people reach for
   * the Share button.
   */
  const handleViewSale = (sale: Sale) => {
    setViewingSale(sale);
    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 0));
    idle(() => {
      captureReceiptFor(sale).catch(() => {});
    });
  };

  /**
   * If a sale gets edited, its old cached receipt image is stale (amounts,
   * items, etc. may have changed). Drop it so the next view re-captures.
   */
  const handleEditSale = (sale: Sale) => {
    invalidateReceiptCapture(sale._id);
    setSelectedSale(sale);
    setVoiceDraft(null);
    setDrawerOpen(true);
  };

  /**
   * Called by SaleDetail after a successful inline payment patch.
   * Updates the local viewingSale so the drawer reflects the new status
   * instantly without needing to close and reopen.
   */
  const handlePaymentUpdate = (updated: Sale) => {
    setViewingSale(updated);
  };

  // Compute stat values from available data
  const totalOrders = pagination?.total ?? 0;
  const totalSalesAmt = s?.totalSales ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalSalesAmt / totalOrders : 0;
  const pendingAmount = s?.pendingAmount ?? 0;

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
          <div className="flex items-center gap-2">
            <VoiceMicButton<VoiceSaleExtract> context="sale" onResult={handleVoiceResult} />
            <Button leftIcon={<Plus size={16} />} onClick={() => { setSelectedSale(null); setVoiceDraft(null); setDrawerOpen(true); }}>
              Add Sale
            </Button>
          </div>
        }
      />

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <PageStatCard
          label="Total Sales"
          value={formatCurrency(totalSalesAmt)}
          delta={s?.salesDelta}
          deltaLabel="vs last month"
          isLoading={summary.isLoading}
          accentColor="#C8873A"
        />
        <PageStatCard
          label="Total Orders"
          value={totalOrders.toLocaleString("en-IN")}
          delta={s?.salesDelta}
          deltaLabel="vs last month"
          isLoading={isLoading}
          accentColor="#4C9A6E"
        />
        <PageStatCard
          label="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          isLoading={summary.isLoading || isLoading}
          accentColor="#5B7EC8"
        />
        <PageStatCard
          label="Pending Amount"
          value={formatCurrency(pendingAmount)}
          isLoading={summary.isLoading}
          accentColor="#B8862E"
        />
      </div>

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

      {/* Mobile search + filter bar */}
      <div className="md:hidden mb-4">
        <MobileSearchFilterBar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onFilterClick={() => setFilterDrawerOpen(true)}
        />
      </div>

      {/* Mobile-only: SaleFilters in controlled mode (renders only the MobileBottomDrawer, no layout div needed) */}
      <SaleFilters
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        status={status} onStatusChange={(v) => { setStatus(v); setPage(1); }}
        paymentMode={paymentMode} onPaymentModeChange={(v) => { setPaymentMode(v); setPage(1); }}
        datePreset={datePreset} onDatePresetChange={(v) => { setDatePreset(v); setPage(1); }}
        startDate={startDate} onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
        endDate={endDate} onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
        minAmount={minAmount} onMinAmountChange={(v) => { setMinAmount(v); setPage(1); }}
        maxAmount={maxAmount} onMaxAmountChange={(v) => { setMaxAmount(v); setPage(1); }}
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
      />

      {/* Desktop: wrap in glass-card; Mobile: no wrapper to avoid white column bleed */}
      <div className="hidden md:block glass-card p-1 overflow-hidden">
        <SalesTable
          data={sales}
          isLoading={isLoading}
          onAdd={() => { setSelectedSale(null); setVoiceDraft(null); setDrawerOpen(true); }}
          onView={handleViewSale}
          onEdit={handleEditSale}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
      <div className="md:hidden">
        <SalesTable
          data={sales}
          isLoading={isLoading}
          onAdd={() => { setSelectedSale(null); setVoiceDraft(null); setDrawerOpen(true); }}
          onView={handleViewSale}
          onEdit={handleEditSale}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      <SaleDrawer
        open={drawerOpen}
        sale={selectedSale}
        voiceDefaultValues={voiceDraft?.defaultValues}
        voiceTranscript={voiceDraft?.transcript}
        onClose={() => { setDrawerOpen(false); setSelectedSale(null); setVoiceDraft(null); }}
      />

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
              onEdit={() => { setSelectedSale(viewingSale); setVoiceDraft(null); setViewingSale(null); setDrawerOpen(true); }}
              onDelete={() => { setDeleteId(viewingSale._id); setViewingSale(null); }}
              onPaymentUpdate={handlePaymentUpdate}
            />
          </>
        )}
      </AnimatePresence>

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