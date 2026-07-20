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
  const { mutateAsync: deleteExp, isPending: isDeleting } = useDeleteExpenditure();
  const { mutateAsync: updateExp, isPending: isUpdating } = useUpdateExpenditure();

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

  return (
    <>
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

      {/* Edit drawer */}
      <Drawer open={!!editItem} onClose={() => setEditItem(null)} title="Edit Expense" subtitle="Update expense details">
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
      </Drawer>

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
