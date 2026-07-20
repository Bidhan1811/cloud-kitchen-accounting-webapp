"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { SkeletonTable } from "./Skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  loadingRows?: number;
  className?: string;
  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  limit?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState,
  onRowClick,
  loadingRows = 6,
  className,
  page,
  totalPages,
  onPageChange,
  total,
  limit,
}: DataTableProps<T>) {
  const showPagination = totalPages && totalPages > 1 && onPageChange;

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(col.headerClassName)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.18)]">
                    {columns.map((col, colIdx) => {
                      const width = 60 + ((i * 7 + colIdx * 13) % 40);
                      return (
                        <td key={String(col.key)} className="px-[14px] py-[13px]">
                          <div className="skeleton h-[13px] rounded-[6px]" style={{ width: `${width}%` }} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  {emptyState}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr
                  key={keyExtractor(row)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: rowIndex < 8 ? rowIndex * 0.03 : 0 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={cn(col.className)}>
                      {col.render
                        ? col.render(row, rowIndex)
                        : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!!showPagination && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-[12px] text-[#9E8E80]">
            {total
              ? `Showing ${((page! - 1) * (limit ?? 10)) + 1}–${Math.min(page! * (limit ?? 10), total)} of ${total} entries`
              : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              className="btn-icon"
              onClick={() => onPageChange!(page! - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {(() => {
              const maxVisible = 5;
              let start = Math.max(1, page! - Math.floor(maxVisible / 2));
              let end = Math.min(totalPages!, start + maxVisible - 1);
              start = Math.max(1, end - maxVisible + 1);

              return Array.from({ length: end - start + 1 }, (_, i) => {
                const p = start + i;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange!(p)}
                    className={cn(
                      "w-[32px] h-[32px] rounded-[8px] text-[12px] font-[500] transition-all",
                      p === page
                        ? "bg-[#C8873A] text-white shadow-[0_2px_8px_rgba(200,135,58,0.25)]"
                        : "text-[#6B5D50] hover:bg-[rgba(200,135,58,0.12)] hover:text-[#C8873A]"
                    )}
                  >
                    {p}
                  </button>
                );
              });
            })()}
            <button
              className="btn-icon"
              onClick={() => onPageChange!(page! + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}