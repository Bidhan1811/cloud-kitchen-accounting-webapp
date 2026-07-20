"use client";

import React from "react";
import type { TopItem } from "../services/dashboard.service";
import { Skeleton } from "@/components/ui/Skeleton";
import { UtensilsCrossed } from "lucide-react";

interface TopItemsListProps {
  items?: TopItem[];
  isLoading?: boolean;
}

export function TopItemsList({ items, isLoading }: TopItemsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton width={36} height={36} className="rounded-[10px] flex-shrink-0" />
            <div className="flex-1">
              <Skeleton height={12} width="60%" className="mb-2" />
              <Skeleton height={6} width="100%" />
            </div>
            <Skeleton height={12} width={30} />
          </div>
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <p className="text-[13px] text-[#9E8E80] text-center py-8">No data yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const pct = item.maxOrders > 0 ? (item.ordersCount / item.maxOrders) * 100 : 0;
        return (
          <div key={item._id} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(200,135,58,0.12)] flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed size={16} className="text-[#C8873A]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-[4px]">
                <p className="text-[13px] font-[500] text-[#1C1410] truncate pr-2">{item.name}</p>
                <span className="text-[11px] text-[#9E8E80] flex-shrink-0">{item.ordersCount}</span>
              </div>
              <div className="h-[4px] rounded-full bg-[rgba(255,255,255,0.3)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C8873A] transition-all duration-700"
                  style={{ width: `${pct}%`, opacity: 0.7 + (i === 0 ? 0.3 : 0) }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
