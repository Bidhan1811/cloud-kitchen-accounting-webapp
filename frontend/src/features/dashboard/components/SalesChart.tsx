"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import type { ChartDataPoint } from "../services/dashboard.service";
import { formatCurrencyCompact } from "@/utils/formatCurrency";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/providers/ThemeProvider";

interface SalesChartProps {
  data?: ChartDataPoint[];
  isLoading?: boolean;
}

const CHART_COLORS = {
  light: {
    salesStroke: "#C8873A",
    salesGradStart: "rgba(200, 135, 58, 0.30)",
    salesGradEnd: "rgba(200, 135, 58, 0)",
    expStroke: "#9E8E80",
    expGradStart: "rgba(158, 142, 128, 0.20)",
    expGradEnd: "rgba(158, 142, 128, 0)",
    grid: "rgba(255, 255, 255, 0.20)",
    axis: "#9E8E80",
    cursor: "rgba(255, 255, 255, 0.30)",
    activeDotSales: "#C8873A",
    activeDotExp: "#6B5D50",
  },
  dark: {
    salesStroke: "#D6A97A",
    salesGradStart: "rgba(214, 169, 122, 0.22)",
    salesGradEnd: "rgba(214, 169, 122, 0)",
    expStroke: "#6B5D50",
    expGradStart: "rgba(107, 93, 80, 0.14)",
    expGradEnd: "rgba(107, 93, 80, 0)",
    grid: "rgba(214, 169, 122, 0.07)",
    axis: "#96877C",
    cursor: "rgba(214, 169, 122, 0.20)",
    activeDotSales: "#D6A97A",
    activeDotExp: "#8B7060",
  },
};

const CustomTooltip = ({
  active,
  payload,
  label,
  isDark,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
  isDark: boolean;
}) => {
  if (!active || !payload?.length) return null;
  const c = isDark ? CHART_COLORS.dark : CHART_COLORS.light;
  return (
    <div className="glass-card px-4 py-3 text-[12px] min-w-[130px]">
      <p style={{ color: c.axis }} className="mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span
            className="capitalize"
            style={{ color: p.dataKey === "sales" ? c.salesStroke : c.axis }}
          >
            {p.dataKey}
          </span>
          <span
            className="font-mono font-[600]"
            style={{ color: p.dataKey === "sales" ? c.salesStroke : c.axis }}
          >
            {formatCurrencyCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SalesChart({ data, isLoading }: SalesChartProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const c = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  if (isLoading) {
    return <Skeleton className="w-full h-[200px] rounded-[16px]" />;
  }

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[13px]" style={{ color: c.axis }}>
        No chart data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={c.salesStroke} stopOpacity={isDark ? 0.22 : 0.30} />
            <stop offset="95%" stopColor={c.salesStroke} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={c.expStroke} stopOpacity={isDark ? 0.14 : 0.20} />
            <stop offset="95%" stopColor={c.expStroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: c.axis }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: c.axis }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatCurrencyCompact}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as unknown as { value: number; dataKey: string }[]}
              label={props.label as string}
              isDark={isDark}
            />
          )}
          cursor={{ stroke: c.cursor, strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke={c.expStroke}
          strokeWidth={1.5}
          fill="url(#expGrad)"
          dot={false}
          activeDot={{ r: 4, fill: c.activeDotExp, stroke: isDark ? "#1A1412" : "#fff", strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke={c.salesStroke}
          strokeWidth={2}
          fill="url(#salesGrad)"
          dot={false}
          activeDot={{ r: 5, fill: c.activeDotSales, stroke: isDark ? "#1A1412" : "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
