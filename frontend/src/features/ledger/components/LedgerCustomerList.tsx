"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Wallet, TrendingDown, TrendingUp, Minus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatCurrency";
import { generateInitials, stringToColor } from "@/utils/strings";
import { customerService } from "@/features/customers/services/customer.service";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { ROUTES } from "@/constants/routes";
import type { Customer } from "@/features/customers/types/customer.types";

interface LedgerCustomerListProps {
  activeCustomerId?: string;
}

function BalancePill({ customer }: { customer: Customer }) {
  const bal = customer.creditBalance;
  if (!bal) return null;

  if (bal.isSettled) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-[600] text-[#9E8E80] bg-[rgba(158,142,128,0.12)] px-2 py-0.5 rounded-full">
        <Minus size={9} /> Settled
      </span>
    );
  }
  if (bal.isAdvance) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-[600] text-[#4C9A6E] bg-[rgba(76,154,110,0.12)] px-2 py-0.5 rounded-full">
        <TrendingUp size={9} /> +{formatCurrency(bal.amount)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-[600] text-[#C0524A] bg-[rgba(192,82,74,0.10)] px-2 py-0.5 rounded-full">
      <TrendingDown size={9} /> {formatCurrency(bal.amount)}
    </span>
  );
}

export function LedgerCustomerList({ activeCustomerId }: LedgerCustomerListProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.CREDIT_CUSTOMERS({ search, isCreditCustomer: true }),
    queryFn: () =>
      customerService.getAll({ isCreditCustomer: true, search, limit: 100 }),
    staleTime: 30_000,
  });

  const customers: Customer[] = (data as any)?.customers ?? (data as any)?.data ?? [];

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      )
    : customers;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={16} className="text-[#C8873A]" />
          <p className="text-[14px] font-[700] text-[#1C1410]">Credit Ledgers</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8E80] pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-8 pr-3 py-2 text-[12px] rounded-[10px] bg-[rgba(255,252,246,0.70)] border border-[rgba(255,255,255,0.45)] text-[#1C1410] placeholder:text-[#9E8E80] outline-none focus:ring-1 focus:ring-[rgba(200,135,58,0.40)]"
          />
        </div>
      </div>

      {/* Customer list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 flex flex-col gap-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-[58px] rounded-[14px]" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[12px] text-[#9E8E80]">
              {search ? "No customers match your search." : "No credit customers yet."}
            </p>
          </div>
        ) : (
          filtered.map((customer) => {
            const isActive = customer._id === activeCustomerId;
            return (
              <Link
                key={customer._id}
                href={ROUTES.LEDGER_CUSTOMER(customer._id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all group",
                  isActive
                    ? "bg-[rgba(200,135,58,0.13)] border border-[rgba(200,135,58,0.30)]"
                    : "hover:bg-[rgba(30,20,10,0.05)]"
                )}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-[700] text-white flex-shrink-0 shadow-sm"
                  style={{ background: stringToColor(customer.name) }}
                >
                  {generateInitials(customer.name)}
                </div>

                {/* Name + phone */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[13px] font-[600] truncate leading-[1.3]",
                      isActive ? "text-[#C8873A]" : "text-[#1C1410]"
                    )}
                  >
                    {customer.name}
                  </p>
                  <p className="text-[10px] text-[#9E8E80] truncate">{customer.phone}</p>
                </div>

                {/* Balance pill */}
                <BalancePill customer={customer} />
              </Link>
            );
          })
        )}
      </div>

      {/* Footer count */}
      {!isLoading && filtered.length > 0 && (
        <div className="px-4 pb-3 pt-1 flex-shrink-0 border-t border-[rgba(255,255,255,0.30)]">
          <p className="text-[10px] text-[#9E8E80] text-center">
            {filtered.length} credit customer{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
