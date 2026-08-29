import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/utils/cn";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalEntries?: number;
  entriesPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalEntries,
  entriesPerPage = 10,
}: PaginationProps) {
  if (totalPages <= 1 && !totalEntries) return null;

  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = totalEntries ? Math.min(currentPage * entriesPerPage, totalEntries) : currentPage * entriesPerPage;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PageButton
            key={i}
            page={i}
            isActive={currentPage === i}
            onClick={() => onPageChange(i)}
          />
        );
      }
    } else {
      pages.push(
        <PageButton
          key={1}
          page={1}
          isActive={currentPage === 1}
          onClick={() => onPageChange(1)}
        />
      );

      if (currentPage > 3) {
        pages.push(<Ellipsis key="e1" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(
          <PageButton
            key={i}
            page={i}
            isActive={currentPage === i}
            onClick={() => onPageChange(i)}
          />
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(<Ellipsis key="e2" />);
      }

      pages.push(
        <PageButton
          key={totalPages}
          page={totalPages}
          isActive={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        />
      );
    }
    return pages;
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 w-full text-[13px] text-[#6B5D50]", className)}>
      {totalEntries !== undefined ? (
        <div>
          Showing {startEntry} to {endEntry} of {totalEntries} entries
        </div>
      ) : (
        <div /> 
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.6)] text-[#6B5D50] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.6)] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.6)] text-[#6B5D50] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.6)] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function PageButton({ page, isActive, onClick }: { page: number; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-[500] transition-colors border",
        isActive
          ? "bg-white border-white text-[#C8873A] shadow-[0_2px_8px_rgba(200,135,58,0.15)]"
          : "bg-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.6)] text-[#6B5D50] hover:bg-[rgba(255,255,255,0.6)]"
      )}
    >
      {page}
    </button>
  );
}

function Ellipsis() {
  return (
    <div className="flex items-center justify-center w-8 h-8 text-[#9E8E80]">
      <MoreHorizontal size={16} />
    </div>
  );
}
