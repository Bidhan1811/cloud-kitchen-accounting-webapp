"use client";

import React, { useState } from "react";
import { Eye, Pencil, Trash2, FileText } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { generateInitials, stringToColor } from "@/utils/strings";
import { useDeleteSale } from "../hooks/useSales";
import type { Sale } from "../types/sale.types";
import { MobileListCard } from "@/components/mobile/MobileListCard";

interface SalesTableProps {
  data: Sale[];
  isLoading: boolean;
  onAdd: () => void;
  onView: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}

export function SalesTable({
  data,
  isLoading,
  onAdd,
  onView,
  onEdit,
  page,
  totalPages,
  total,
  onPageChange,
}: SalesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { mutateAsync: deleteSale, isPending: isDeleting } = useDeleteSale();

  const columns: Column<Sale>[] = [
    {
      key: "invoiceId",
      header: "Invoice ID",
      render: (row) => (
        <span className="font-mono text-[12px] text-[#C8873A] font-[600]">{row.invoiceId}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (row) => (
        <span className="text-[13px]">{row.customer?.name ?? row.customerName ?? "Walk-in"}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="text-[12px] text-[#9E8E80]">{formatDate(row.date)}</span>
      ),
    },
    {
      key: "grandTotal",
      header: "Amount",
      className: "amount",
      render: (row) => formatCurrency(row.grandTotal),
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: "paymentMode",
      header: "Payment",
      render: (row) => (
        <span className="text-[12px] text-[#6B5D50]">{row.paymentMode ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onView(row); }} aria-label="View sale">
            <Eye size={15} />
          </button>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(row); }} aria-label="Edit sale">
            <Pencil size={15} />
          </button>
          <button
            className="btn-icon hover:bg-[rgba(192,82,74,0.12)] hover:text-[#C0524A] hover:border-[rgba(192,82,74,0.20)]"
            onClick={(e) => { e.stopPropagation(); setDeleteId(row._id); }}
            aria-label="Delete sale"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Desktop Table — UNCHANGED */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data}
          keyExtractor={(row) => row._id}
          isLoading={isLoading}
          onRowClick={onView}
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={onPageChange}
          emptyState={
            <EmptyState
              icon={<FileText size={24} />}
              title="No sales yet"
              description="Record your first sale to see it appear here."
              action={{ label: "+ Add Sale", onClick: onAdd }}
            />
          }
        />
      </div>

      {/* Mobile List */}
      <div className="md:hidden flex flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-4 flex gap-3 h-[72px]">
              <div className="skeleton h-full w-full rounded-md" />
            </div>
          ))
        ) : data.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="No sales yet"
            description="Record your first sale."
            action={{ label: "+ Add Sale", onClick: onAdd }}
          />
        ) : (
          data.map((sale) => {
            const name = sale.customer?.name ?? sale.customerName ?? "Walk-in";
            return (
              <MobileListCard
                key={sale._id}
                onClick={() => onView(sale)}
                avatar={
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                    style={{ background: stringToColor(name) }}
                  >
                    {generateInitials(name)}
                  </div>
                }
                title={name}
                subtitle={
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#9E8E80]">{sale.invoiceId}</span>
                    <span className="text-[11px] text-[#9E8E80]">•</span>
                    <span className="text-[11px] text-[#9E8E80]">{formatDate(sale.date)}</span>
                  </div>
                }
                trailing={
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-jetbrains font-bold text-[14px] text-text-primary leading-none">
                      {formatCurrency(sale.grandTotal)}
                    </span>
                    <StatusBadge status={sale.paymentStatus} />
                  </div>
                }
              />
            );
          })
        )}
      </div>

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
    </>
  );
}