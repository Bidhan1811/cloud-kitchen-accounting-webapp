"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useDashboard(period = "this_month") {
  const summary = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_SUMMARY,
    queryFn: () => dashboardService.getSummary(period),
    staleTime: 1000 * 60 * 5,
  });

  const chartData = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_CHART("last_30_days"),
    queryFn: () => dashboardService.getChartData("last_30_days"),
    staleTime: 1000 * 60 * 5,
  });

  const topItems = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_TOP_ITEMS,
    queryFn: dashboardService.getTopItems,
    staleTime: 1000 * 60 * 10,
  });

  const recentSales = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_RECENT_SALES,
    queryFn: dashboardService.getRecentSales,
    staleTime: 1000 * 60 * 2,
  });

  return { summary, chartData, topItems, recentSales };
}
