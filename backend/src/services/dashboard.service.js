import { Sale } from "../models/Sale.js";
import { Expenditure } from "../models/Expenditure.js";

export const getDashboardSummary = async (matchStage = {}) => {
  // Aggregate Sales
  const salesAgg = await Sale.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$grandTotal" },
        totalOrders: { $sum: 1 },
        unpaidAmount: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "Unpaid"] }, "$grandTotal", 0],
          },
        },
      },
    },
  ]);

  // Aggregate Expenditure
  const expAgg = await Expenditure.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalExpenditure: { $sum: "$amount" },
      },
    },
  ]);

  const salesData = salesAgg[0] || { totalSales: 0, totalOrders: 0, unpaidAmount: 0 };
  const expData = expAgg[0] || { totalExpenditure: 0 };
  const netProfit = salesData.totalSales - expData.totalExpenditure;

  return {
    ...salesData,
    ...expData,
    netProfit,
  };
};

export const getMonthlySummary = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1); // 1st of next month

  const matchStage = {
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  return await getDashboardSummary(matchStage);
};

export const getTrend = async (months = 12) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const matchStage = { date: { $gte: startDate, $lte: endDate } };

  // Sales Trend
  const salesTrend = await Sale.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        sales: { $sum: "$grandTotal" },
      },
    },
  ]);

  // Expenditure Trend
  const expTrend = await Expenditure.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        expenditure: { $sum: "$amount" },
      },
    },
  ]);

  // Merge and format trends
  const trendMap = {};

  salesTrend.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
    trendMap[key] = { month: key, sales: item.sales, expenditure: 0, profit: item.sales };
  });

  expTrend.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
    if (!trendMap[key]) {
      trendMap[key] = { month: key, sales: 0, expenditure: item.expenditure, profit: -item.expenditure };
    } else {
      trendMap[key].expenditure = item.expenditure;
      trendMap[key].profit = trendMap[key].sales - item.expenditure;
    }
  });

  // Convert map to sorted array
  return Object.values(trendMap).sort((a, b) => (a.month > b.month ? 1 : -1));
};

export const getTopItems = async (matchStage = {}) => {
  const topItems = await Sale.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.itemName",
        quantity: { $sum: "$items.quantity" },
        lineTotal: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 10 },
  ]);

  return topItems.map(item => ({
    itemName: item._id,
    quantity: item.quantity,
    revenue: item.lineTotal
  }));
};
