"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, TrendingDown, TrendingUp, AlertCircle, Bell, Calendar } from "lucide-react";
import { SummaryCard } from "@/components/common/SummaryCard";
import { SalesChart } from "@/features/dashboard/components/SalesChart";
import { TopItemsList } from "@/features/dashboard/components/TopItemsList";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { useAuthContext } from "@/providers/AuthProvider";
import { getGreeting, formatMonthRange } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { StatusBadge } from "@/components/ui";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { summary, chartData, topItems, recentSales } = useDashboard();
  const s = summary.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Greeting bar */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-[28px] font-[600] text-[#1C1410] leading-[1.2]">
            Dashboard
          </h1>
          <p className="text-[13px] text-[#9E8E80] mt-[3px]">
            {getGreeting()}, {user?.name ?? "Chef"} ☀️ — {formatMonthRange()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn-icon" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          title="Total Sales"
          value={s?.totalSales ?? 0}
          icon={<ShoppingBag size={18} className="text-[#C8873A]" />}
          delta={s?.salesDelta}
          deltaLabel="vs last month"
          delay={0}
        />
        <SummaryCard
          title="Total Expenses"
          value={s?.totalExpenses ?? 0}
          icon={<TrendingDown size={18} className="text-[#C0524A]" />}
          iconBg="rgba(192,82,74,0.12)"
          delta={s?.expensesDelta}
          deltaLabel="vs last month"
          delay={60}
        />
        <SummaryCard
          title="Net Profit"
          value={s?.netProfit ?? 0}
          icon={<TrendingUp size={18} className="text-[#4C9A6E]" />}
          iconBg="rgba(76,154,110,0.12)"
          delta={s?.profitDelta}
          deltaLabel="vs last month"
          delay={120}
        />
        <SummaryCard
          title="Pending Amount"
          value={s?.pendingAmount ?? 0}
          icon={<AlertCircle size={18} className="text-[#B8862E]" />}
          iconBg="rgba(184,134,46,0.12)"
          delay={180}
        />
      </div>

      {/* Chart + Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Chart — 60% */}
        <motion.div
          className="glass-card p-5 lg:col-span-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[15px] font-[600] text-[#1C1410]">Sales vs Expenses</p>
              <p className="text-[11px] text-[#9E8E80] mt-[1px]">Last 30 days</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#9E8E80]">
              <span className="flex items-center gap-[5px]">
                <span className="w-2 h-2 rounded-full bg-[#C8873A]" />
                Sales
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="w-2 h-2 rounded-full bg-[#9E8E80]" />
                Expenses
              </span>
            </div>
          </div>
          <SalesChart data={chartData.data} isLoading={chartData.isLoading} />
        </motion.div>

        {/* Top Items — 40% */}
        <motion.div
          className="glass-card p-5 lg:col-span-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="mb-4">
            <p className="text-[15px] font-[600] text-[#1C1410]">Top Items This Month</p>
            <p className="text-[11px] text-[#9E8E80] mt-[1px]">By number of orders</p>
          </div>
          <TopItemsList items={topItems.data} isLoading={topItems.isLoading} />
        </motion.div>
      </div>

      {/* Recent Sales */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[15px] font-[600] text-[#1C1410]">Recent Sales</p>
            <p className="text-[11px] text-[#9E8E80] mt-[1px]">Latest transactions</p>
          </div>
          <a href="/sales" className="text-[12px] text-[#C8873A] font-[500] hover:underline">
            View all →
          </a>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[rgba(255,255,255,0.18)]">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-[14px] py-[13px]">
                          <div className="skeleton h-[13px] rounded-[6px] w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : recentSales.data?.map((sale) => (
                    <tr key={sale._id}>
                      <td className="font-mono text-[12px] text-[#C8873A]">{sale.invoiceId}</td>
                      <td>{sale.customerName}</td>
                      <td className="text-[12px] text-[#9E8E80]">{formatDate(sale.date)}</td>
                      <td className="amount">{formatCurrency(sale.amount)}</td>
                      <td><StatusBadge status={sale.status} /></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
