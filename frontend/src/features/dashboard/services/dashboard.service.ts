import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";

export interface DashboardSummary {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  pendingAmount: number;
  salesDelta?: number;
  expensesDelta?: number;
  profitDelta?: number;
  period: string;
}

export interface ChartDataPoint {
  date: string;
  sales: number;
  expenses: number;
}

export interface TopItem {
  _id: string;
  name: string;
  category: string;
  ordersCount: number;
  maxOrders: number;
}

export interface RecentSale {
  _id: string;
  invoiceId: string;
  customerName: string;
  amount: number;
  status: string;
  paymentMode?: string;
  date: string;
}

export const dashboardService = {
  getSummary: async (period: string = "this_month"): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<ApiResponse<DashboardSummary>>(`/dashboard/summary?period=${period}`);
    return data.data;
  },

  getChartData: async (period: string = "last_30_days"): Promise<ChartDataPoint[]> => {
    const { data } = await apiClient.get<ApiResponse<ChartDataPoint[]>>(`/dashboard/chart?period=${period}`);
    return data.data;
  },

  getTopItems: async (): Promise<TopItem[]> => {
    const { data } = await apiClient.get<ApiResponse<TopItem[]>>("/dashboard/top-items");
    return data.data;
  },

  getRecentSales: async (): Promise<RecentSale[]> => {
    const { data } = await apiClient.get<ApiResponse<RecentSale[]>>("/dashboard/recent-sales");
    return data.data;
  },

  getMonthlySales: async (): Promise<number> => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const { data } = await apiClient.get<ApiResponse<{ totalSales: number }>>(
      `/dashboard/monthly?month=${month}&year=${year}`
    );
    return data.data?.totalSales ?? 0;
  },
};
