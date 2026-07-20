import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as dashboardService from "../services/dashboard.service.js";
import { ApiError } from "../utils/ApiError.js";

export const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardSummary();
  return res.status(200).json(new ApiResponse(200, data, "Overall summary fetched successfully"));
});

export const getMonthly = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  if (!month || !year) {
    throw new ApiError(400, "Month and year are required query parameters");
  }

  const data = await dashboardService.getMonthlySummary(Number(month), Number(year));
  
  // Optionally fetch top items for the month
  const startDate = new Date(Number(year), Number(month) - 1, 1);
  const endDate = new Date(Number(year), Number(month), 1);
  data.topItems = await dashboardService.getTopItems({
    date: { $gte: startDate, $lt: endDate }
  });

  return res.status(200).json(new ApiResponse(200, data, "Monthly summary fetched successfully"));
});

export const getTrend = asyncHandler(async (req, res) => {
  const { range } = req.query; // e.g., '12m'
  const months = range ? parseInt(range.replace("m", "")) : 12;
  
  const data = await dashboardService.getTrend(months);
  return res.status(200).json(new ApiResponse(200, data, "Trend data fetched successfully"));
});

export const getChart = asyncHandler(async (req, res) => {
  const { period } = req.query; // e.g. "last_30_days"
  const days = period ? parseInt(period.replace("last_", "").replace("_days", "")) || 30 : 30;

  const data = await dashboardService.getChartData(days);
  return res.status(200).json(new ApiResponse(200, data, "Chart data fetched successfully"));
});

export const getTopItems = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTopItemsForDashboard();
  return res.status(200).json(new ApiResponse(200, data, "Top items fetched successfully"));
});

export const getRecentSales = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentSales(10);
  return res.status(200).json(new ApiResponse(200, data, "Recent sales fetched successfully"));
});
