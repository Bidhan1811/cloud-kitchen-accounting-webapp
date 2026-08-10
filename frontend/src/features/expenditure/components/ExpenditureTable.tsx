"use client";

import React, { useState } from "react";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { ExpenseForm } from "./ExpenseForm";
import { useCreateExpenditure, useDeleteExpenditure, useUpdateExpenditure } from "../hooks/useExpenditures";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { EXPENSE_CATEGORIES } from "@/constants/lookups";
import type { Expenditure } from "../types/expenditure.types";
import { MobileListCard } from "@/components/mobile/MobileListCard";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { useIsMobile } from "@/hooks";
import { Button } from "@/components/ui/Button";

interface ExpenditureTableProps {
  data: Expenditure[];
  isLoading: boolean;
  onAdd: () => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}

export function ExpenditureTable({ data, isLoading, onAdd, page, totalPages, total, onPageChange }: ExpenditureTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Expenditure | null>(null);
  const [viewItem, setViewItem] = useState<Expenditure | null>(null);
  const { mutateAsync: deleteExp, isPending: isDeleting } = useDeleteExpenditure();
  const { mutateAsync: updateExp, isPending: isUpdating } = useUpdateExpenditure();

  const isMobile = useIsMobile();

  const getCategoryLabel = (val: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === val)?.label ?? val;

  const columns: Column<Expenditure>[] = [
    {
      key: "expenseId",
      header: "Expense ID",
      render: (row) => <span className="font-mono text-[12px] text-[#C8873A] font-[600]">{row.expenseId}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <Badge variant="pending" className="text-[11px]">{getCategoryLabel(row.category)}</Badge>
      ),
    },
    { key: "items", header: "Item", render: (row) => <span className="text-[13px]">{row.items}</span> },
    { key: "date", header: "Date", render: (row) => <span className="text-[12px] text-[#9E8E80]">{formatDate(row.date)}</span> },
    { key: "amount", header: "Amount", className: "amount", render: (row) => formatCurrency(row.amount) },
    {
      key: "paymentMode",
      header: "Payment",
      render: (row) => <span className="text-[12px] text-[#6B5D50] uppercase">{row.paymentMode}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button className="btn-icon" onClick={() => setEditItem(row)} aria-label="Edit expense"><Pencil size={15} /></button>
          <button
            className="btn-icon hover:bg-[rgba(192,82,74,0.12)] hover:text-[#C0524A]"
            onClick={() => setDeleteId(row._id)}
            aria-label="Delete expense"
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
              icon={<Receipt size={24} />}
              title="No expenses yet"
              description="Record your first expense to track spending."
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
            icon={<Receipt size={24} />}
            title="No expenses yet"
            description="Record your first expense."
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
                  <span className="font-mono text-[11px] text-[#9E8E80]">{exp.expenseId}</span>
                  <span className="text-[11px] text-[#9E8E80]">•</span>
                  <span className="text-[11px] text-[#9E8E80]">{formatDate(exp.date)}</span>
                </div>
              }
              trailing={
                <div className="flex flex-col items-end gap-1.5">
                  <span className="font-jetbrains font-bold text-[14px] text-text-primary leading-none">
                    {formatCurrency(exp.amount)}
                  </span>
                  <Badge variant="pending" className="text-[10px] px-1.5 py-0">{getCategoryLabel(exp.category)}</Badge>
                </div>
              }
            />
          ))
        )}
      </div>

      {/* Edit drawer */}
      <FormDrawerComponent open={!!editItem} onClose={() => setEditItem(null)} title="Edit Expense" subtitle="Update expense details">
        {editItem && (
          <ExpenseForm
            defaultValues={{ ...editItem }}
            isSubmitting={isUpdating}
            onCancel={() => setEditItem(null)}
            onSubmit={async (data) => {
              await updateExp({ id: editItem._id, payload: data as Parameters<typeof updateExp>[0]["payload"] });
              setEditItem(null);
            }}
          />
        )}
      </FormDrawerComponent>

      <MobileBottomDrawer
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.expenseId}
        subtitle={getCategoryLabel(viewItem?.category ?? "")}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setDeleteId(viewItem?._id ?? null); setViewItem(null); }}>
              Delete
            </Button>
            <Button className="flex-1" onClick={() => { setEditItem(viewItem); setViewItem(null); }}>
              Edit
            </Button>
          </div>
        }
      >
        {viewItem && (
          <div className="glass-card p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[#6B5D50] text-[13px]">Date</span>
              <span className="text-[#1C1410] font-medium text-[13px]">{formatDate(viewItem.date)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#6B5D50] text-[13px]">Item / Description</span>
              <span className="text-[#1C1410] font-medium text-[14px]">{viewItem.items}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B5D50] text-[13px]">Amount</span>
              <span className="font-jetbrains font-bold text-[16px] text-text-primary">{formatCurrency(viewItem.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B5D50] text-[13px]">Payment Mode</span>
              <span className="text-[#1C1410] font-medium uppercase text-[13px]">{viewItem.paymentMode}</span>
            </div>
            {viewItem.notes && (
              <div className="mt-2">
                <p className="text-[12px] uppercase tracking-wide text-[#9E8E80] font-[600] mb-1">Notes</p>
                <p className="text-[14px] text-[#1C1410]">{viewItem.notes}</p>
              </div>
            )}
          </div>
        )}
      </MobileBottomDrawer>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) await deleteExp(deleteId); setDeleteId(null); }}
        title="Delete this expense?"
        description="This action cannot be undone."
        loading={isDeleting}
      />
    </>
  );
}
