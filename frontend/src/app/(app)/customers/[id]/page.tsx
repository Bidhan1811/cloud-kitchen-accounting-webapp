"use client";

import React, {use} from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCustomer, useCustomerOrders } from "@/features/customers/hooks/useCustomers";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { generateInitials, stringToColor } from "@/utils/strings";
import { cn } from "@/utils/cn";
import { SaleDetail } from "@/features/sales/components/SaleDetail";
import { AnimatePresence } from "framer-motion";
import type { Sale } from "@/features/sales/types/sale.types";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }>; }) {
  const { id } = use(params);
  const { data: customer, isLoading } = useCustomer(id);
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders(id);
  const [viewingSale, setViewingSale] = React.useState<Sale | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonCard className="h-[140px]" />
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
      className="flex flex-col gap-5"
    >
      {/* Back */}
      <Link href="/customers" className="flex items-center gap-2 text-[13px] text-[#9E8E80] hover:text-[#C8873A] transition-colors w-fit">
        <ArrowLeft size={16} /> Back to Customers
      </Link>

      {/* Profile header */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-[700] text-[#C8873A] flex-shrink-0"
          style={{ background: stringToColor(customer.name) }}
        >
          {generateInitials(customer.name)}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-[24px] font-[600] text-[#1C1410]">{customer.name}</h1>
          <p className="text-[13px] text-[#9E8E80]">{customer.phone}</p>
          {customer.address && <p className="text-[12px] text-[#9E8E80] mt-[2px]">{customer.address}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Total Orders", value: customer.totalOrders, mono: false },
            { label: "Total Spent", value: formatCurrency(customer.totalSpend), mono: true },
            { label: "Outstanding", value: formatCurrency(customer.outstanding), mono: true, danger: customer.outstanding > 0 },
          ].map((stat) => (
            <div key={stat.label} className="glass-card px-4 py-3">
              <p className="text-[11px] text-[#9E8E80] uppercase tracking-wide font-[500]">{stat.label}</p>
              <p className={cn("font-mono text-[18px] font-[700] mt-1", stat.danger ? "text-[#C0524A]" : "text-[#1C1410]")}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order history */}
      <div className="glass-card p-5">
        <p className="text-[15px] font-[600] text-[#1C1410] mb-4">Order History</p>
        {ordersLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-[50px] rounded-[12px]" />
            ))}
          </div>
        ) : !orders?.length ? (
          <p className="text-[13px] text-[#9E8E80] text-center py-8">No orders found for this customer.</p>
        ) : (
          <div className="w-full overflow-x-auto">
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
        )}
      </div>

      {/* Detail view modal */}
      <AnimatePresence>
        {viewingSale && (
          <>
            <div
              className="fixed inset-0 z-[50] bg-[rgba(30,20,10,0.15)] backdrop-blur-[3px]"
              onClick={() => setViewingSale(null)}
            />
            <SaleDetail
              sale={viewingSale}
              onClose={() => setViewingSale(null)}
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
