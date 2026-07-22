"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, TrendingDown, TrendingUp, AlertCircle, Bell } from "lucide-react";
import { SummaryCard } from "@/components/common/SummaryCard";
import { SalesChart } from "@/features/dashboard/components/SalesChart";
import { TopItemsList } from "@/features/dashboard/components/TopItemsList";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { useAuthContext } from "@/providers/AuthProvider";
import { getGreeting, formatMonthRange } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { StatusBadge } from "@/components/ui";
import { MobileStatCard } from "@/components/mobile/MobileStatCard";
import { MobileListCard } from "@/components/mobile/MobileListCard";
import { generateInitials, stringToColor } from "@/utils/strings";
import { SaleDrawer } from "@/features/sales/components/SaleDrawer";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { summary, chartData, topItems, recentSales } = useDashboard();
  const s = summary.data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Local drawer state for the mobile "Add Sale" quick action
  // (previously relied on a global FAB/context that has been removed)
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);

  const mobileStatCards = [
    {
      label: "Net Profit",
      value: formatCurrency(s?.netProfit ?? 0),
      icon: TrendingUp,
      trendValue: s?.profitDelta ? `${Math.abs(s.profitDelta).toFixed(1)}%` : undefined,
      trendUp: s?.profitDelta ? s.profitDelta > 0 : undefined,
      hero: true,
      heroColor: "linear-gradient(135deg, #2E7D52 0%, #1B5E38 100%)",
    },
    {
      label: "Total Sales",
      value: formatCurrency(s?.totalSales ?? 0),
      icon: ShoppingBag,
      trendValue: s?.salesDelta ? `${Math.abs(s.salesDelta).toFixed(1)}%` : undefined,
      trendUp: s?.salesDelta ? s.salesDelta > 0 : undefined,
      hero: true,
      heroColor: "linear-gradient(135deg, #C8873A 0%, #A0651F 100%)",   
    },
    {
      label: "Expenses",
      value: formatCurrency(s?.totalExpenses ?? 0),
      icon: TrendingDown,
      trendValue: s?.expensesDelta ? `${Math.abs(s.expensesDelta).toFixed(1)}%` : undefined,
      trendUp: s?.expensesDelta ? s.expensesDelta > 0 : undefined,
      hero: true,
      heroColor: "linear-gradient(135deg, #C0524A 0%, #8E3931 100%)",
    },
    {
      label: "Pending",
      value: formatCurrency(s?.pendingAmount ?? 0),
      icon: AlertCircle,
      hero: true,
      heroColor: "linear-gradient(135deg, #B8862E 0%, #8A6420 100%)",
    },
  ];

  // Quick action config — "Add Sale" opens the local drawer instead of navigating
  const quickActions = [
    { label: "Add Sale", icon: ShoppingBag, color: "#4C9A6E", type: "action" as const },
    { label: "Add Item", icon: TrendingUp, color: "#C8873A", type: "link" as const, href: "/menu" },
    { label: "Expense", icon: TrendingDown, color: "#C0524A", type: "link" as const, href: "/expenditure" },
    { label: "Customers", icon: AlertCircle, color: "#B8862E", type: "link" as const, href: "/customers" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Greeting bar */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="font-display text-[22px] md:text-[28px] font-[600] text-[#1C1410] leading-[1.2]">
            Dashboard
          </h1>
          <p className="text-[12px] md:text-[13px] text-[#9E8E80] mt-[3px]">
            {getGreeting()}, {user?.name ?? "Chef"} ☀️
            <span className="hidden md:inline"> — {formatMonthRange()}</span>
          </p>
          <p className="text-[11px] text-[#9E8E80] mt-[1px] md:hidden">{formatMonthRange()}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn-icon" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* ── Desktop: 4-col grid — UNCHANGED ── */}
      <div className="hidden md:grid grid-cols-4 gap-3 mb-6">
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

      {/* ── Mobile: horizontal snap carousel ── */}
      <div className="md:hidden mb-5 ml-2">
        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const cardWidth = el.scrollWidth / mobileStatCards.length;
            const index = Math.round(el.scrollLeft / cardWidth);
            setActiveCardIndex(Math.min(index, mobileStatCards.length - 1));
          }}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {mobileStatCards.map((card) => (
            <div
              key={card.label}
              className={cn_class(card.hero ? "w-[calc(80vw)] min-w-[270px]" : "w-[calc(55vw)] min-w-[180px]", "snap-start flex-shrink-0")}
            >
              <MobileStatCard
                label={card.label}
                value={card.value}
                icon={card.icon}
                trendValue={card.trendValue}
                trendUp={card.trendUp}
                hero={card.hero}
                heroColor={card.heroColor}
                className="h-full"
              />
            </div>
          ))}
        </div>
        {/* Scroll indicator dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {mobileStatCards.map((_, i) => (
            <div
              key={i}
              className={cn_class(
                "h-1.5 rounded-full bg-[#4C9A6E] transition-all",
                i === activeCardIndex ? "w-4 opacity-100" : "w-1.5 opacity-30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Chart + Top Items — UNCHANGED */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
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
                <span className="w-2 h-2 rounded-full bg-[#4C9A6E]" />
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

        <motion.div
          className="glass-card p-5 lg:col-span-2 hidden md:block"
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

      {/* Quick Actions — mobile only */}
      <div className="md:hidden mb-5">
        <p className="text-[14px] font-semibold text-text-primary mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) =>
            action.type === "action" ? (
              <button
                key={action.label}
                type="button"
                onClick={() => setSaleDrawerOpen(true)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${action.color}18` }}
                >
                  <action.icon size={22} style={{ color: action.color }} />
                </div>
                <span className="text-[11px] text-text-secondary text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ) : (
              <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${action.color}18` }}
                >
                  <action.icon size={22} style={{ color: action.color }} />
                </div>
                <span className="text-[11px] text-text-secondary text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Recent Sales — UNCHANGED */}
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
          <a href="/sales" className="text-[12px] text-[#4C9A6E] font-[500] hover:underline">
            View all →
          </a>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block w-full overflow-x-auto">
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

        {/* Mobile List */}
        <div className="md:hidden flex flex-col gap-3">
          {recentSales.isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/60 rounded-2xl p-4 h-[72px] animate-pulse" />
              ))
            : recentSales.data?.map((sale) => {
                const name = sale.customerName ?? "Walk-in";
                return (
                  <MobileListCard
                    key={sale._id}
                    avatar={
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                        style={{ background: stringToColor(name) }}
                      >
                        {generateInitials(name)}
                      </div>
                    }
                    title={name}
                    subtitle={
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono">{sale.invoiceId}</span>
                        <span>·</span>
                        <span>{formatDate(sale.date)}</span>
                      </span>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-jetbrains font-bold text-[14px] text-text-primary leading-none">
                          {formatCurrency(sale.amount)}
                        </span>
                        <StatusBadge status={sale.status} />
                      </div>
                    }
                  />
                );
              })}
        </div>
      </motion.div>

      {/* Add Sale drawer — mobile Quick Action only; desktop uses the Sales page button */}
      <SaleDrawer open={saleDrawerOpen} onClose={() => setSaleDrawerOpen(false)} />
    </motion.div>
  );
}

// inline helper so we don't need to import cn (avoids naming collision with existing logic)
function cn_class(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}