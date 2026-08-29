"use client";

import React, { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, TrendingDown, TrendingUp, AlertCircle, Bell, CreditCard, Banknote, Smartphone, Clock, ChevronRight } from "lucide-react";
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
import { generateInitials, stringToColor } from "@/utils/strings";
import { SaleDrawer } from "@/features/sales/components/SaleDrawer";
import Link from "next/link";
import { useSales } from "@/features/sales/hooks/useSales";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { NotificationPanel, deriveNotifications } from "@/components/common/NotificationPanel";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { summary, chartData, topItems, recentSales } = useDashboard();
  const s = summary.data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Fetch all unpaid/partial sales for notifications (cached, lightweight)
  const { data: unpaidSalesData } = useSales({ status: "Unpaid", limit: 50 });
  const { data: partialSalesData } = useSales({ status: "Partial", limit: 50 });
  // Fetch credit customers for ledger balance alerts
  const { data: creditCustomersData } = useCustomers({ isCreditCustomer: true, limit: 50 });

  const notifications = useMemo(() => {
    const allPending = [
      ...(unpaidSalesData?.data ?? []),
      ...(partialSalesData?.data ?? []),
    ];
    const customers = creditCustomersData?.data ?? [];
    return deriveNotifications(allPending, customers, s?.pendingAmount);
  }, [unpaidSalesData, partialSalesData, creditCustomersData, s?.pendingAmount]);

  const unreadCount = notifications.filter((n) => n.type !== "success").length;

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

  const quickActions = [
    { label: "Add Sale", icon: ShoppingBag, color: "#4C9A6E", type: "action" as const },
    { label: "Add Item", icon: TrendingUp, color: "#C8873A", type: "link" as const, href: "/menu" },
    { label: "Expense", icon: TrendingDown, color: "#C0524A", type: "link" as const, href: "/expenditure" },
    { label: "Customers", icon: AlertCircle, color: "#B8862E", type: "link" as const, href: "/customers" },
  ];

  // Derived data for the 3 bottom info cards
  const sales = recentSales.data ?? [];
  const pendingSales = sales.filter((s) => s.status === "Unpaid" || s.status === "Partial");

  // Payment methods breakdown from recent sales — paymentMode is now typed on RecentSale
  const PM_COLORS: Record<string, string> = {
    UPI: "#C8873A",
    Cash: "#4C9A6E",
    Card: "#5B7EC8",
    Credit: "#B8862E",
    Other: "#9E8E80",
  };
  const pmCounts = sales.reduce<Record<string, number>>((acc, sale) => {
    const mode = sale.paymentMode ?? "Other";
    acc[mode] = (acc[mode] ?? 0) + 1;
    return acc;
  }, {});
  const totalPayments = sales.length || 1;
  const pmEntries = Object.entries(pmCounts).sort((a, b) => b[1] - a[1]);

  const pmIcons: Record<string, React.ReactNode> = {
    UPI: <Smartphone size={13} />,
    Cash: <Banknote size={13} />,
    Card: <CreditCard size={13} />,
    Credit: <Clock size={13} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Greeting bar */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-[600] text-[#1C1410] leading-[1.2]">
            Dashboard
          </h1>
          <p className="text-[12px] md:text-[13px] text-[#9E8E80] mt-[3px]">
            {getGreeting()}, {user?.name ?? "Chef"} ☀️
            <span className="hidden md:inline"> — {formatMonthRange()}</span>
          </p>
          <p className="text-[11px] text-[#9E8E80] mt-[1px] md:hidden">{formatMonthRange()}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bell with unread badge */}
          <div className="relative">
            <button
              ref={bellRef}
              className="btn-icon"
              aria-label="Notifications"
              onClick={() => setNotifOpen((o) => !o)}
            >
              <Bell size={18} />
            </button>
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-[700] text-white pointer-events-none"
                style={{ background: "#C0524A" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <NotificationPanel
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              notifications={notifications}
              anchorRef={bellRef}
            />
          </div>
        </div>
      </div>

      {/* ── Desktop: 4-col summary cards ── */}
      <div className="hidden md:grid grid-cols-4 gap-3 mb-6">
        <SummaryCard
          title="Total Sales"
          value={s?.totalSales ?? 0}
          icon={<ShoppingBag size={18} className="text-white" />}
          heroColor="linear-gradient(135deg, #C8873A 0%, #A0651F 100%)"
          delta={s?.salesDelta}
          deltaLabel="vs last month"
          delay={0}
        />
        <SummaryCard
          title="Total Expenses"
          value={s?.totalExpenses ?? 0}
          icon={<TrendingDown size={18} className="text-white" />}
          heroColor="linear-gradient(135deg, #C0524A 0%, #8E3931 100%)"
          delta={s?.expensesDelta}
          deltaLabel="vs last month"
          delay={60}
        />
        <SummaryCard
          title="Net Profit"
          value={s?.netProfit ?? 0}
          icon={<TrendingUp size={18} className="text-white" />}
          heroColor="linear-gradient(135deg, #2E7D52 0%, #1B5E38 100%)"
          delta={s?.profitDelta}
          deltaLabel="vs last month"
          delay={120}
        />
        <SummaryCard
          title="Pending Amount"
          value={s?.pendingAmount ?? 0}
          icon={<AlertCircle size={18} className="text-white" />}
          heroColor="linear-gradient(135deg, #B8862E 0%, #8A6420 100%)"
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
              className={cln(card.hero ? "w-[calc(80vw)] min-w-[270px]" : "w-[calc(55vw)] min-w-[180px]", "snap-start flex-shrink-0")}
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
        <div className="flex justify-center gap-1.5 mt-2">
          {mobileStatCards.map((_, i) => (
            <div
              key={i}
              className={cln(
                "h-1.5 rounded-full bg-[#4C9A6E] transition-all",
                i === activeCardIndex ? "w-4 opacity-100" : "w-1.5 opacity-30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Chart + Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        <motion.div
          className="glass-card p-5 lg:col-span-3 flex flex-col"
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
          <div className="flex-1 min-h-[200px]">
            <SalesChart data={chartData.data} isLoading={chartData.isLoading} />
          </div>
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
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${action.color}18` }}>
                  <action.icon size={22} style={{ color: action.color }} />
                </div>
                <span className="text-[11px] text-text-secondary text-center leading-tight">{action.label}</span>
              </button>
            ) : (
              <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${action.color}18` }}>
                  <action.icon size={22} style={{ color: action.color }} />
                </div>
                <span className="text-[11px] text-text-secondary text-center leading-tight">{action.label}</span>
              </Link>
            )
          )}
        </div>
      </div>

      {/* ── 3 compact info cards — replaces big table ── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* 1. Recent Transactions */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-[600] text-[#1C1410]">Recent Transactions</p>
            <Link href="/sales" className="text-[12px] text-[#4C9A6E] font-[500] hover:underline flex items-center gap-0.5">
              View All <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col gap-0">
            {recentSales.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 py-2">
                    <div className="skeleton h-7 w-7 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="skeleton h-3 w-24 mb-1 rounded" />
                      <div className="skeleton h-2.5 w-14 rounded" />
                    </div>
                    <div className="skeleton h-3 w-14 rounded" />
                  </div>
                ))
              : sales.length === 0
              ? <p className="text-[12px] text-[#9E8E80] text-center py-4">No recent transactions</p>
              : sales.slice(0, 5).map((sale) => {
                  const name = sale.customerName ?? "Walk-in";
                  return (
                    <div key={sale._id} className="flex items-center gap-2.5 py-2 border-b border-[rgba(158,142,128,0.08)] last:border-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: stringToColor(name) }}
                      >
                        {generateInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-[500] text-[#1C1410] truncate leading-tight">{name}</p>
                        <p className="text-[11px] text-[#9E8E80] font-mono leading-tight">{sale.invoiceId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-[13px] font-[600] text-[#1C1410]">{formatCurrency(sale.amount)}</span>
                        <StatusBadge status={sale.status} />
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* 2. Pending Payments */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-[600] text-[#1C1410]">Pending Payments</p>
            <Link href="/sales" className="text-[12px] text-[#4C9A6E] font-[500] hover:underline flex items-center gap-0.5">
              View All <ChevronRight size={13} />
            </Link>
          </div>
          {!recentSales.isLoading && (
            <div className="rounded-xl bg-[rgba(184,134,46,0.08)] border border-[rgba(200,135,58,0.15)] px-3 py-2 flex items-center justify-between">
              <span className="text-[12px] text-[#9E8E80]">Outstanding</span>
              <span className="text-[15px] font-[700] font-mono text-[#C8873A]">{formatCurrency(s?.pendingAmount ?? 0)}</span>
            </div>
          )}
          <div className="flex flex-col gap-0">
            {recentSales.isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 py-2">
                    <div className="skeleton h-7 w-7 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="skeleton h-3 w-24 mb-1 rounded" />
                      <div className="skeleton h-2.5 w-14 rounded" />
                    </div>
                    <div className="skeleton h-3 w-14 rounded" />
                  </div>
                ))
              : pendingSales.length === 0
              ? (
                <div className="flex flex-col items-center py-6 gap-2">
                  <div className="w-9 h-9 rounded-full bg-[rgba(91,173,130,0.12)] flex items-center justify-center">
                    <TrendingUp size={18} className="text-[#4C9A6E]" />
                  </div>
                  <p className="text-[12px] text-[#9E8E80]">All payments cleared!</p>
                </div>
              )
              : pendingSales.slice(0, 4).map((sale) => {
                  const name = sale.customerName ?? "Walk-in";
                  return (
                    <div key={sale._id} className="flex items-center gap-2.5 py-2 border-b border-[rgba(158,142,128,0.08)] last:border-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: stringToColor(name) }}
                      >
                        {generateInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-[500] text-[#1C1410] truncate leading-tight">{name}</p>
                        <p className="text-[11px] text-[#9E8E80] leading-tight">{formatDate(sale.date)}</p>
                      </div>
                      <span className="text-[13px] font-[600] text-[#C0524A] flex-shrink-0">{formatCurrency(sale.amount)}</span>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* 3. Payment Methods — donut chart */}
        <div className="glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-[600] text-[#1C1410]">Payment Methods</p>
            <span className="text-[11px] text-[#9E8E80] bg-[rgba(158,142,128,0.10)] px-2 py-0.5 rounded-full">{sales.length} orders</span>
          </div>
          {recentSales.isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4">
              <div className="skeleton w-[150px] h-[150px] rounded-full" />
              <div className="flex gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="skeleton w-2.5 h-2.5 rounded-full" />
                    <div className="skeleton h-2.5 w-12 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : pmEntries.length === 0 ? (
            <p className="text-[12px] text-[#9E8E80] text-center py-4">No data</p>
          ) : (
            <DonutChart entries={pmEntries} totalPayments={totalPayments} colors={PM_COLORS} />
          )}
        </div>
      </motion.div>

      {/* Add Sale drawer */}
      <SaleDrawer open={saleDrawerOpen} onClose={() => setSaleDrawerOpen(false)} />
    </motion.div>
  );
}

function cln(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Inline donut chart (pure SVG, no external chart lib needed) ──────────────
interface DonutChartProps {
  entries: [string, number][];
  totalPayments: number;
  colors: Record<string, string>;
}

function DonutChart({ entries, totalPayments, colors }: DonutChartProps) {
  const SIZE = 170;
  const STROKE = 20;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const CENTER = SIZE / 2;
  const GAP_FRAC = entries.length > 1 ? 0.018 : 0;

  let cumulative = 0;
  const slices = entries.map(([mode, count]) => {
    const pct = count / totalPayments;
    const dash = CIRC * Math.max(0, pct - GAP_FRAC);
    const offset = CIRC * (1 - cumulative);
    cumulative += pct;
    return { mode, pct, dash, offset };
  });

  return (
    <div className="flex flex-col items-center gap-4 flex-1 justify-center py-2">
      {/* Large centred donut */}
      <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track ring */}
          <circle
            cx={CENTER} cy={CENTER} r={R}
            fill="none"
            stroke="rgba(158,142,128,0.08)"
            strokeWidth={STROKE}
          />
          {slices.map(({ mode, dash, offset }) => {
            const color = colors[mode] ?? "#9E8E80";
            return (
              <circle
                key={mode}
                cx={CENTER} cy={CENTER} r={R}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={`${dash} ${CIRC - dash}`}
                strokeDashoffset={offset}
                style={{
                  transition: "stroke-dasharray 0.7s cubic-bezier(0.32,0.72,0,1), stroke-dashoffset 0.7s cubic-bezier(0.32,0.72,0,1)",
                }}
              />
            );
          })}
        </svg>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[24px] font-[700] text-[#1C1410] leading-none">{totalPayments}</span>
          <span className="text-[11px] text-[#9E8E80] mt-1 leading-none tracking-wide">orders</span>
        </div>
      </div>

      {/* Thin horizontal legend row */}
      <div className="flex items-center justify-center gap-4 flex-wrap w-full border-t border-[rgba(158,142,128,0.10)] pt-3">
        {entries.map(([mode, count]) => {
          const color = colors[mode] ?? "#9E8E80";
          const pct = Math.round((count / totalPayments) * 100);
          return (
            <div key={mode} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[12px] font-[500] text-[#1C1410]">{mode}</span>
              <span className="text-[11px] text-[#9E8E80] font-mono">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
