import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/utils/cn";

interface MobileSearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  onFilterClick?: () => void;
  className?: string;
}

export function MobileSearchFilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  onFilterClick,
  className,
}: MobileSearchFilterBarProps) {
  return (
    <div className={cn("flex items-center gap-2 w-full md:hidden", className)}>
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-glass-input backdrop-blur-sm border border-glass-border rounded-[12px] py-2.5 pl-10 pr-4 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent min-h-[44px]"
        />
      </div>
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-glass-input backdrop-blur-sm border border-glass-border rounded-[12px] text-text-secondary active:bg-accent-light active:text-accent transition-colors"
          aria-label="Filters"
        >
          <SlidersHorizontal size={18} />
        </button>
      )}
    </div>
  );
}
