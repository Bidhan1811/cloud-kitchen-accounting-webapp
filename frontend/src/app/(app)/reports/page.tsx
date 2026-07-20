"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { SummaryCard } from "@/components/common/SummaryCard";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatCurrencyCompact } from "@/utils/formatCurrency";
import { cn } from "@/utils/cn";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { ShoppingBag, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

const PERIODS = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Last 3 Months", value: "last_3_months" },
  { label: "This Year", value: "this_year" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-[12px] min-w-[140px]">
      <p className="text-[#9E8E80] mb-2 font-[500]">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className="capitalize" style={{ color: p.color }}>{p.dataKey}</span>
          <span className="font-mono font-[600]" style={{ color: p.color }}>{formatCurrencyCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("this_month");

  const { data: summary } = useQuery({
    queryKey: ["reports", "summary", period],
    queryFn: async () => {
      const { data } = await apiClient.get(`/dashboard/summary?period=${period}`);
      return data.data;
    },
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["reports", "monthly-chart"],
    queryFn: async () => {
      const { data } = await apiClient.get("/dashboard/trend");
      return data.data as { month: string; sales: number; expenses: number; profit: number }[];
    },
  });

  const handleExport = async () => {
    try {
      const response = await apiClient.get(`/reports/export?period=${period}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `restro-rasoi-report-${period}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // Handle silently
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <PageHeader
        title="Reports"
        subtitle="Financial overview and analytics"
        action={
          <Button variant="secondary" leftIcon={<Download size={16} />} onClick={handleExport}>
            Export CSV
          </Button>
        }
      />

      {/* Period selector */}
      <div className="glass-input inline-flex p-[3px] gap-[2px] rounded-full mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-4 py-[8px] rounded-full text-[12px] font-[500] transition-all",
              period === p.value
                ? "bg-[#C8873A] text-white shadow-[0_2px_8px_rgba(200,135,58,0.25)]"
                : "text-[#9E8E80] hover:text-[#6B5D50]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard title="Total Sales" value={summary?.totalSales ?? 0}
          icon={<ShoppingBag size={18} className="text-[#C8873A]" />} delay={0} />
        <SummaryCard title="Total Expenses" value={summary?.totalExpenses ?? 0}
          icon={<TrendingDown size={18} className="text-[#C0524A]" />}
          iconBg="rgba(192,82,74,0.12)" delay={60} />
        <SummaryCard title="Net Profit" value={summary?.netProfit ?? 0}
          icon={<TrendingUp size={18} className="text-[#4C9A6E]" />}
          iconBg="rgba(76,154,110,0.12)" delay={120} />
        <SummaryCard title="Pending Amount" value={summary?.pendingAmount ?? 0}
          icon={<AlertCircle size={18} className="text-[#B8862E]" />}
          iconBg="rgba(184,134,46,0.12)" delay={180} />
      </div>

      {/* Monthly bar chart */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={18} className="text-[#C8873A]" />
          <p className="text-[15px] font-[600] text-[#1C1410]">Monthly Sales vs Expenses</p>
        </div>
        {chartLoading ? (
          <div className="skeleton h-[280px] rounded-[16px]" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.20)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9E8E80" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9E8E80" }} axisLine={false} tickLine={false} tickFormatter={formatCurrencyCompact} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(v) => <span style={{ fontSize: 12, color: "#6B5D50", textTransform: "capitalize" }}>{v}</span>}
              />
              <Bar dataKey="sales" fill="rgba(200,135,58,0.70)" radius={[6, 6, 0, 0]} name="sales" />
              <Bar dataKey="expenses" fill="rgba(192,82,74,0.55)" radius={[6, 6, 0, 0]} name="expenses" />
              <Bar dataKey="profit" fill="rgba(76,154,110,0.60)" radius={[6, 6, 0, 0]} name="profit" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
