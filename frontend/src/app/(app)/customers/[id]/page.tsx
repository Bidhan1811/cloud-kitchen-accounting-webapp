"use client";

import React, { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Receipt, ShoppingBag, Wallet, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useCustomer, useCustomerOrders } from "@/features/customers/hooks/useCustomers";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { generateInitials, stringToColor } from "@/utils/strings";
import { cn } from "@/utils/cn";
import { SaleDetail } from "@/features/sales/components/SaleDetail";
import type { Sale } from "@/features/sales/types/sale.types";
import { MobileStatCard } from "@/components/mobile/MobileStatCard";
import { MobileListCard } from "@/components/mobile/MobileListCard";
import { useIsMobile } from "@/hooks";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }>; }) {
  const { id } = use(params);
  const { data: customer, isLoading } = useCustomer(id);
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders(id);
  const [viewingSale, setViewingSale] = React.useState<Sale | null>(null);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonCard className="h-[100px]" />
        <SkeletonCard className="h-[90px]" />
        <SkeletonCard className="h-[400px]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-[15px] font-[600] text-[#1C1410]">Customer not found</p>
        <Link href="/customers" className="text-[13px] text-[#C8873A] mt-2 inline-block hover:underline">
          ← Return to Customers
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-4"
    >
      {/* Back */}
      <Link href="/customers" className="flex items-center gap-2 text-[13px] text-[#9E8E80] hover:text-[#C8873A] transition-colors w-fit">
        <ArrowLeft size={16} /> Back to Customers
      </Link>

      {/* ─── Profile header ─── */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-[700] text-white flex-shrink-0"
          style={{ background: stringToColor(customer.name) }}
        >
          {generateInitials(customer.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-[20px] md:text-[24px] font-[600] text-[#1C1410] truncate">{customer.name}</h1>
          <p className="text-[13px] text-[#9E8E80] mt-[2px]">{customer.phone}</p>
          {customer.address && <p className="text-[12px] text-[#9E8E80] mt-[1px] truncate">{customer.address}</p>}
        </div>
        {/* Desktop quick stats inline */}
        <div className="hidden md:flex items-center gap-3">
          {[
            { label: "Orders", value: customer.totalOrders },
            { label: "Total Spent", value: formatCurrency(customer.totalSpend) },
            { label: "Outstanding", value: formatCurrency(customer.outstanding), danger: customer.outstanding > 0 },
          ].map((stat) => (
            <div key={stat.label} className="glass-card px-4 py-3 text-center min-w-[100px]">
              <p className="text-[11px] text-[#9E8E80] uppercase tracking-wide font-[500]">{stat.label}</p>
              <p className={cn("font-mono text-[16px] font-[700] mt-1", stat.danger ? "text-[#C0524A]" : "text-[#1C1410]")}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Mobile stat cards — separate row BELOW the header ─── */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        <MobileStatCard
          label="Total Spent"
          value={formatCurrency(customer.totalSpend)}
          icon={Wallet}
          className="!min-w-0"
        />
        <MobileStatCard
          label="Orders"
          value={customer.totalOrders.toString()}
          icon={ShoppingBag}
          className="!min-w-0"
        />
        {customer.outstanding > 0 && (
          <div className="col-span-2">
            <MobileStatCard
              label="Outstanding"
              value={formatCurrency(customer.outstanding)}
              icon={AlertCircle}
              trendUp={false}
              trendValue="Due"
              className="!min-w-0 w-full"
            />
          </div>
        )}
      </div>

      {/* ─── Order history ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-[600] text-[#1C1410]">Order History</p>
          <span className="text-[12px] text-[#9E8E80]">{orders?.length ?? 0} orders</span>
        </div>

        {ordersLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-[64px] rounded-2xl" />
            ))}
          </div>
        ) : !orders?.length ? (
          <p className="text-[13px] text-[#9E8E80] text-center py-8">No orders found for this customer.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block glass-card p-1 overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="cursor-pointer hover:bg-[rgba(200,135,58,0.04)] transition-colors"
                      onClick={() => setViewingSale(order)}
                    >
                      <td className="font-mono text-[12px] text-[#C8873A] font-[600]">{order.invoiceId}</td>
                      <td className="text-[12px] text-[#9E8E80]">{formatDate(order.date)}</td>
                      <td className="amount">{formatCurrency(order.grandTotal)}</td>
                      <td><StatusBadge status={order.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden flex flex-col gap-3">
              {orders.map((order) => (
                <MobileListCard
                  key={order._id}
                  onClick={() => setViewingSale(order)}
                  avatar={
                    <div className="w-10 h-10 rounded-full bg-[#4C9A6E]/10 flex items-center justify-center text-[#4C9A6E]">
                      <Receipt size={18} />
                    </div>
                  }
                  title={order.invoiceId}
                  subtitle={formatDate(order.date)}
                  trailing={
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-jetbrains font-bold text-[14px] text-text-primary">
                        {formatCurrency(order.grandTotal)}
                      </span>
                      <StatusBadge status={order.paymentStatus} />
                    </div>
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail view */}
      <AnimatePresence>
        {viewingSale && (
          <>
            {!isMobile && (
              <div
                className="fixed inset-0 z-[50] bg-[rgba(30,20,10,0.15)] backdrop-blur-[3px]"
                onClick={() => setViewingSale(null)}
              />
            )}
            <SaleDetail
              sale={viewingSale}
              onClose={() => setViewingSale(null)}
              onEdit={() => {}}
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
