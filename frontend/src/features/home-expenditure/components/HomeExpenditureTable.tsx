"use client";

import React, { useState } from "react";
import { Pencil, Trash2, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
/* Badge is kept for non-category uses; HomeCategoryBadge handles category colours */

/* ── Per-category colour tokens ─────────────────────────────────────
   Each entry: [bg (light), text (light), bg (dark), text (dark)]
   We use inline CSS vars so they adapt to the active theme automatically.
   The colours are hand-picked to feel warm / premium and distinct.     */
const CATEGORY_BADGE: Record<
  string,
  { bg: string; color: string; darkBg: string; darkColor: string }
> = {
  groceries:     { bg: "rgba(76,154,110,0.13)",    color: "#3a7d59",   darkBg: "rgba(91,173,130,0.14)",  darkColor: "#5BAD82" },
  rent:          { bg: "rgba(184,134,46,0.13)",    color: "#8a6018",   darkBg: "rgba(212,160,74,0.14)",  darkColor: "#D4A04A" },
  utilities:     { bg: "rgba(59,130,246,0.12)",    color: "#1d5fa8",   darkBg: "rgba(123,158,217,0.16)", darkColor: "#7B9ED9" },
  medical:       { bg: "rgba(192,82,74,0.12)",     color: "#a03028",   darkBg: "rgba(217,123,115,0.14)", darkColor: "#D97B73" },
  education:     { bg: "rgba(100,80,200,0.11)",    color: "#5038a8",   darkBg: "rgba(155,126,200,0.16)", darkColor: "#9B7EC8" },
  transport:     { bg: "rgba(13,148,136,0.12)",    color: "#0a6b62",   darkBg: "rgba(45,185,170,0.14)",  darkColor: "#2DB9AA" },
  entertainment: { bg: "rgba(217,119,6,0.12)",     color: "#a05a04",   darkBg: "rgba(251,171,55,0.14)",  darkColor: "#FBAB37" },
  clothing:      { bg: "rgba(219,39,119,0.10)",    color: "#9b1555",   darkBg: "rgba(244,114,182,0.14)", darkColor: "#F472B6" },
  household:     { bg: "rgba(100,116,139,0.12)",   color: "#3d4f63",   darkBg: "rgba(148,163,184,0.14)", darkColor: "#94A3B8" },
  miscellaneous: { bg: "rgba(155,114,88,0.13)",    color: "#6b4c32",   darkBg: "rgba(217,150,74,0.14)",  darkColor: "#D9964A" },
};

function HomeCategoryBadge({ category, label, className }: { category: string; label: string; className?: string }) {
  const token = CATEGORY_BADGE[category] ?? CATEGORY_BADGE.miscellaneous;
  return (
    <span
      className={["badge", className].filter(Boolean).join(" ")}
      style={{
        /* Light-mode values are the default; dark-mode overrides via data-theme */
        background: `var(--hcb-bg-${category}, ${token.bg})`,
        color: `var(--hcb-color-${category}, ${token.color})`,
      } as React.CSSProperties}
      data-category={category}
    >
      {label}
    </span>
  );
}
import { HomeExpenseForm } from "./HomeExpenseForm";
import {
  useCreateHomeExpenditure,
  useDeleteHomeExpenditure,
  useUpdateHomeExpenditure,
} from "../hooks/useHomeExpenditures";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { HOME_EXPENSE_CATEGORIES } from "@/constants/lookups";
import type { HomeExpenditure } from "../types/homeExpenditure.types";
import { MobileListCard } from "@/components/mobile/MobileListCard";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { useIsMobile } from "@/hooks";
import { Button } from "@/components/ui/Button";

interface HomeExpenditureTableProps {
  data: HomeExpenditure[];
  isLoading: boolean;
  onAdd: () => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}

export function HomeExpenditureTable({
  data,
  isLoading,
  onAdd,
  page,
  totalPages,
  total,
  onPageChange,
}: HomeExpenditureTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<HomeExpenditure | null>(null);
  const [viewItem, setViewItem] = useState<HomeExpenditure | null>(null);
  const { mutateAsync: deleteExp, isPending: isDeleting } =
    useDeleteHomeExpenditure();
  const { mutateAsync: updateExp, isPending: isUpdating } =
    useUpdateHomeExpenditure();

  const isMobile = useIsMobile();

  const getCategoryLabel = (val: string) =>
    HOME_EXPENSE_CATEGORIES.find((c) => c.value === val)?.label ?? val;

  const columns: Column<HomeExpenditure>[] = [
    {
      key: "homeExpenseId",
      header: "Expense ID",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#4C9A6E] font-[600]">
          {row.homeExpenseId}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <HomeCategoryBadge
          category={row.category}
          label={getCategoryLabel(row.category)}
          className="text-[11px]"
        />
      ),
    },
    {
      key: "items",
      header: "Item",
      render: (row) => <span className="text-[13px]">{row.items}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="text-[12px] text-[#9E8E80]">{formatDate(row.date)}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "amount",
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: "paymentMode",
      header: "Payment",
      render: (row) => (
        <span className="text-[12px] text-[#6B5D50] uppercase">
          {row.paymentMode}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            className="btn-icon"
            onClick={() => setEditItem(row)}
            aria-label="Edit home expense"
          >
            <Pencil size={15} />
          </button>
          <button
            className="btn-icon hover:bg-[rgba(192,82,74,0.12)] hover:text-[#C0524A]"
            onClick={() => setDeleteId(row._id)}
            aria-label="Delete home expense"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const FormDrawerComponent = isMobile ? MobileBottomDrawer : Drawer;

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data}
          keyExtractor={(r) => r._id}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={onPageChange}
          emptyState={
            <EmptyState
              icon={<Home size={24} />}
              title="No home expenses yet"
              description="Record your first home expense to start tracking."
              action={{ label: "+ Add Expense", onClick: onAdd }}
            />
          }
        />
      </div>

      <div className="md:hidden flex flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-4 flex gap-3 h-[72px]">
              <div className="skeleton h-full w-full rounded-md" />
            </div>
          ))
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Home size={24} />}
            title="No home expenses yet"
            description="Record your first home expense."
            action={{ label: "+ Add Expense", onClick: onAdd }}
          />
        ) : (
          data.map((exp) => (
            <MobileListCard
              key={exp._id}
              onClick={() => setViewItem(exp)}
              title={exp.items}
              subtitle={
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#9E8E80]">
                    {exp.homeExpenseId}
                  </span>
                  <span className="text-[11px] text-[#9E8E80]">•</span>
                  <span className="text-[11px] text-[#9E8E80]">
                    {formatDate(exp.date)}
                  </span>
                </div>
              }
              trailing={
                <div className="flex flex-col items-end gap-1.5">
                  <span className="font-jetbrains font-bold text-[14px] text-text-primary leading-none">
                    {formatCurrency(exp.amount)}
                  </span>
                  <HomeCategoryBadge
                    category={exp.category}
                    label={getCategoryLabel(exp.category)}
                    className="text-[10px] px-1.5 py-0"
                  />
                </div>
              }
            />
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-between mt-2 px-1 pb-1">
            <p className="text-[12px] text-[var(--text-tertiary)]">
              Page {page} of {totalPages}
              {total ? ` · ${total} entries` : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="btn-icon"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[13px] font-[500] text-[var(--text-secondary)]">
                {page}
              </span>
              <button
                className="btn-icon"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit drawer */}
      <FormDrawerComponent
        open={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Home Expense"
        subtitle="Update expense details"
      >
        {editItem && (
          <HomeExpenseForm
            defaultValues={{ ...editItem }}
            isSubmitting={isUpdating}
            onCancel={() => setEditItem(null)}
            onSubmit={async (data) => {
              await updateExp({
                id: editItem._id,
                payload: data as Parameters<typeof updateExp>[0]["payload"],
              });
              setEditItem(null);
            }}
          />
        )}
      </FormDrawerComponent>

      {/* Mobile view drawer */}
      <MobileBottomDrawer
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.homeExpenseId}
        subtitle={getCategoryLabel(viewItem?.category ?? "")}
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setDeleteId(viewItem?._id ?? null);
                setViewItem(null);
              }}
            >
              Delete
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setEditItem(viewItem);
                setViewItem(null);
              }}
            >
              Edit
            </Button>
          </div>
        }
      >
        {viewItem && (
          <div className="glass-card p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[#6B5D50] text-[13px]">Date</span>
              <span className="text-[#1C1410] font-medium text-[13px]">
                {formatDate(viewItem.date)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#6B5D50] text-[13px]">
                Item / Description
              </span>
              <span className="text-[#1C1410] font-medium text-[14px]">
                {viewItem.items}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B5D50] text-[13px]">Amount</span>
              <span className="font-jetbrains font-bold text-[16px] text-text-primary">
                {formatCurrency(viewItem.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B5D50] text-[13px]">Payment Mode</span>
              <span className="text-[#1C1410] font-medium uppercase text-[13px]">
                {viewItem.paymentMode}
              </span>
            </div>
            {viewItem.notes && (
              <div className="mt-2">
                <p className="text-[12px] uppercase tracking-wide text-[#9E8E80] font-[600] mb-1">
                  Notes
                </p>
                <p className="text-[14px] text-[#1C1410]">{viewItem.notes}</p>
              </div>
            )}
          </div>
        )}
      </MobileBottomDrawer>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) await deleteExp(deleteId);
          setDeleteId(null);
        }}
        title="Delete this home expense?"
        description="This action cannot be undone."
        loading={isDeleting}
      />
    </>
  );
}
