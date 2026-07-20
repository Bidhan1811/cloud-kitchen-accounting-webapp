"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import type { ChartDataPoint } from "../services/dashboard.service";
import { formatCurrencyCompact } from "@/utils/formatCurrency";
import { Skeleton } from "@/components/ui/Skeleton";

interface SalesChartProps {
  data?: ChartDataPoint[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-[12px] min-w-[130px]">
      <p className="text-[#9E8E80] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className="capitalize" style={{ color: p.dataKey === "sales" ? "#C8873A" : "#6B5D50" }}>
            {p.dataKey}
          </span>
          <span className="font-mono font-[600]" style={{ color: p.dataKey === "sales" ? "#C8873A" : "#6B5D50" }}>
            {formatCurrencyCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SalesChart({ data, isLoading }: SalesChartProps) {
  if (isLoading) {
    return <Skeleton className="w-full h-[200px] rounded-[16px]" />;
  }

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[13px] text-[#9E8E80]">
        No chart data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C8873A" stopOpacity={0.30} />
            <stop offset="95%" stopColor="#C8873A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6B5D50" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#6B5D50" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.20)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9E8E80" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9E8E80" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatCurrencyCompact}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.30)", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#9E8E80"
          strokeWidth={1.5}
          fill="url(#expGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#6B5D50", stroke: "#fff", strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="#C8873A"
          strokeWidth={2}
          fill="url(#salesGrad)"
          dot={false}
          activeDot={{ r: 5, fill: "#C8873A", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
