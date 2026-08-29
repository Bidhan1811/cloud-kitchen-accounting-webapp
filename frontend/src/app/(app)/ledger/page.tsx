"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Search, Phone, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useIsMobile, useDebounce } from "@/hooks";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/utils/formatCurrency";
import { generateInitials, stringToColor } from "@/utils/strings";
import { MobileListCard } from "@/components/mobile/MobileListCard";
import { MobileSearchFilterBar } from "@/components/mobile/MobileSearchFilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/utils/cn";
import type { Customer } from "@/features/customers/types/customer.types";

export default function LedgerIndexPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useCustomers({
    search: debouncedSearch,
    page,
    limit: 10,
    isCreditCustomer: true,
  });

  const customers: Customer[] = (data as any)?.customers ?? (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;

  const handleCustomerClick = (customer: Customer) => {
    router.push(ROUTES.LEDGER_CUSTOMER(customer._id));
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-[700] text-[#C8873A] flex-shrink-0"
            style={{ background: stringToColor(row.name) }}
          >
            {generateInitials(row.name)}
          </div>
          <div>
            <p className="text-[13px] font-[500] text-[#1C1410]">{row.name}</p>
            <p className="text-[11px] text-[#9E8E80]">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "totalOrders",
      header: "Orders",
      render: (r) => <span className="font-mono font-[600]">{r.totalOrders}</span>,
    },
    {
      key: "totalSpend",
      header: "Total Spend",
      className: "amount",
      render: (r) => formatCurrency(r.totalSpend),
    },
    {
      key: "creditBalance",
      header: "Credit Balance",
      render: (r) => {
        const bal = r.creditBalance;
        if (!bal) return <span className="text-[#9E8E80] font-mono text-[13px]">—</span>;
        return (
          <span
            className={cn(
              "font-mono font-[600] text-[13px]",
              bal.isSettled
                ? "text-[#9E8E80]"
                : bal.isAdvance
                ? "text-[#4C9A6E]"
                : "text-[#C0524A]"
            )}
          >
            {formatCurrency(bal.amount)}
            {bal.isAdvance && <span className="ml-1 text-[10px]">(Advance)</span>}
          </span>
        );
      },
    },
    {
      key: "_action" as keyof Customer,
      header: "",
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCustomerClick(r);
          }}
          className="flex items-center justify-end w-full gap-1 text-[11px] font-[600] text-[#C8873A] hover:underline"
        >
          <BookOpen size={12} /> View Ledger
        </button>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-4 h-full"
    >
      <PageHeader
        title="Credit Ledgers"
        subtitle="Track outstanding balances for credit customers"
      />

      <div className="hidden md:block mb-1">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search credit customers..."
          className="max-w-sm"
        />
      </div>

      <div className="md:hidden mb-2">
        <MobileSearchFilterBar
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      <div className="hidden md:block glass-card p-1 overflow-hidden flex-shrink-0 pb-12">
        <DataTable
          columns={columns}
          data={customers}
          keyExtractor={(r) => r._id}
          isLoading={isLoading}
          onRowClick={(r) => handleCustomerClick(r)}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          limit={10}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={<BookOpen size={24} />}
              title="No credit customers found"
              description="Mark a customer as a credit customer in their profile to see them here."
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
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={24} />}
            title="No credit customers found"
            description="Mark a customer as a credit customer to see them here."
          />
        ) : (
          customers.map((c: Customer) => {
            const bal = c.creditBalance;
            return (
              <MobileListCard
                key={c._id}
                onClick={() => handleCustomerClick(c)}
                avatar={
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-[700] text-[#C8873A] flex-shrink-0"
                    style={{ background: stringToColor(c.name) }}
                  >
                    {generateInitials(c.name)}
                  </div>
                }
                title={c.name}
                subtitle={
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-[11px] text-[#9E8E80]">
                      <Phone size={10} /> {c.phone}
                    </div>
                  </div>
                }
                trailing={
                  bal ? (
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "font-jetbrains font-bold text-[14px]",
                          bal.isSettled
                            ? "text-[#9E8E80]"
                            : bal.isAdvance
                            ? "text-[#4C9A6E]"
                            : "text-[#C0524A]"
                        )}
                      >
                        {formatCurrency(bal.amount)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px]",
                          bal.isSettled
                            ? "text-[#9E8E80]"
                            : bal.isAdvance
                            ? "text-[#4C9A6E]"
                            : "text-[#C0524A]"
                        )}
                      >
                        {bal.label}
                      </span>
                    </div>
                  ) : null
                }
              />
            );
          })
        )}
      </div>
    </motion.div>
  );
}
