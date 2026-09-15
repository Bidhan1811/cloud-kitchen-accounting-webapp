"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { BarChart2, PieChart as PieIcon } from "lucide-react";
import type { HomeExpenditure } from "../types/homeExpenditure.types";
import { HOME_EXPENSE_CATEGORIES } from "@/constants/lookups";
import { formatCurrency } from "@/utils/formatCurrency";

/* ── Palette — drawn from existing theme (amber/warm/complementary) */
const CATEGORY_COLORS = [
  "#D9964A", // amber — accent dark
  "#7B9ED9", // soft indigo-blue
  "#D97B73", // warm coral/danger
  "#5BAD82", // sage green/success
  "#B59A5E", // warm gold
  "#9B7EC8", // soft violet
  "#D4A04A", // warning amber
  "#6BAED9", // sky blue
  "#C87D5A", // terracotta
  "#7BC8A4", // mint
];

interface HomeExpenseStatsProps {
  /** All home expenditure records (full dataset, not paginated) */
  data: HomeExpenditure[];
  isLoading?: boolean;
}

/* ── Helpers ── */
function getCategoryLabel(val: string) {
  return HOME_EXPENSE_CATEGORIES.find((c) => c.value === val)?.label ?? val;
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

/* Custom tooltip for pie */
function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="home-stat-tooltip">
      <span className="home-stat-tooltip-dot" style={{ background: p.color }} />
      <span className="home-stat-tooltip-label">{name}</span>
      <span className="home-stat-tooltip-value">{formatCurrency(value)}</span>
    </div>
  );
}

/* Custom tooltip for bar */
function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="home-stat-tooltip">
      <span className="home-stat-tooltip-label">{label}</span>
      <span className="home-stat-tooltip-value">{formatCurrency(payload[0].value)}</span>
    </div>
  );
}

export function HomeExpenseStats({ data, isLoading }: HomeExpenseStatsProps) {
  /* ── Category breakdown ── */
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return Object.entries(map)
      .map(([key, value]) => ({ name: getCategoryLabel(key), value, key }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  /* ── Monthly trend (last 6 months) ── */
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((e) => {
      const key = formatMonth(e.date);
      map[key] = (map[key] ?? 0) + e.amount;
    });

    // Get last 6 distinct months in chronological order
    const sortedMonths = Object.keys(map).sort((a, b) => {
      const toDate = (s: string) => {
        const [mon, yr] = s.split(" ");
        return new Date(`${mon} 20${yr}`);
      };
      return toDate(a).getTime() - toDate(b).getTime();
    });

    const last6 = sortedMonths.slice(-6);
    return last6.map((month) => ({ month, amount: map[month] }));
  }, [data]);

  const hasData = data.length > 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="glass-card p-5 h-[260px]">
          <div className="skeleton h-4 w-32 mb-4 rounded-md" />
          <div className="skeleton h-full w-full rounded-xl" />
        </div>
        <div className="glass-card p-5 h-[260px]">
          <div className="skeleton h-4 w-32 mb-4 rounded-md" />
          <div className="skeleton h-full w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!hasData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      {/* ── Pie: Category Breakdown ── */}
      <div className="glass-card p-5 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <span className="home-stat-icon-wrap">
            <PieIcon size={14} />
          </span>
          <p className="text-[12px] font-[600] uppercase tracking-wider text-text-tertiary">
            Spend by Category
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-[160px] shrink-0" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categoryData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                      opacity={0.88}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            {categoryData.slice(0, 6).map((item, i) => (
              <div key={item.key} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <span className="text-[12px] text-text-secondary truncate flex-1">
                  {item.name}
                </span>
                <span className="font-mono text-[11px] font-[600] text-text-primary shrink-0">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
            {categoryData.length > 6 && (
              <span className="text-[11px] text-text-tertiary pl-4">
                +{categoryData.length - 6} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Bar: Monthly Trend ── */}
      <div className="glass-card p-5 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <span className="home-stat-icon-wrap">
            <BarChart2 size={14} />
          </span>
          <p className="text-[12px] font-[600] uppercase tracking-wider text-text-tertiary">
            Monthly Trend
          </p>
        </div>

        {monthlyData.length > 0 ? (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                barSize={22}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(155,114,88,0.10)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)", fontFamily: "inherit" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-tertiary)", fontFamily: "inherit" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(155,114,88,0.06)" }} />
                <Bar
                  dataKey="amount"
                  fill="var(--accent)"
                  radius={[6, 6, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[180px]">
            <p className="text-text-tertiary text-[13px]">Not enough data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
