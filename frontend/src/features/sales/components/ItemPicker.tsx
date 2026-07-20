"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import { useMenuItems } from "@/features/menu/hooks/useMenuItems";
import { useDebounce } from "@/hooks";
import type { MenuItem } from "@/features/menu/types/menu.types";
import { formatCurrency } from "@/utils/formatCurrency";
import { Skeleton } from "@/components/ui/Skeleton";

interface ItemPickerProps {
  onSelect: (item: MenuItem) => void;
  onCustom: () => void;
}

export function ItemPicker({ onSelect, onCustom }: ItemPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading } = useMenuItems({ search: debouncedSearch, isActive: true });
  const items = data?.data ?? [];

  return (
    <div className="max-h-[280px] flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-[rgba(255,255,255,0.30)]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8E80]" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className="input pl-8 text-[13px] h-[38px]"
          />
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-3 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={44} className="rounded-[12px]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-[12px] text-[#9E8E80] text-center py-6">No items found</p>
        ) : (
          <div className="p-2 flex flex-col gap-[2px]">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => onSelect(item)}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[12px] hover:bg-[rgba(200,135,58,0.10)] transition-colors text-left w-full"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-[8px] bg-[rgba(200,135,58,0.12)] flex items-center justify-center text-[14px] flex-shrink-0">
                    🍽️
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-[500] text-[#1C1410] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#9E8E80]">{item.category}</p>
                  </div>
                </div>
                <span className="font-mono text-[13px] font-[600] text-[#C8873A] flex-shrink-0">
                  {formatCurrency(item.price)}
                </span>
              </button>
            ))}
            {/* Custom item */}
            <button
              type="button"
              onClick={onCustom}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-[rgba(200,135,58,0.08)] transition-colors w-full border-t border-[rgba(255,255,255,0.25)] mt-1 pt-3"
            >
              <div className="w-8 h-8 rounded-[8px] bg-[rgba(200,135,58,0.08)] flex items-center justify-center flex-shrink-0">
                <Plus size={14} className="text-[#C8873A]" />
              </div>
              <p className="text-[13px] font-[500] text-[#6B5D50]">Other (Custom Item)</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
