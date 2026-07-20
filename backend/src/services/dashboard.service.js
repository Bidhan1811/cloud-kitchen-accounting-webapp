import { Sale } from "../models/Sale.js";
import { Expenditure } from "../models/Expenditure.js";
import { MenuItem } from "../models/MenuItem.js";

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
    totalExpenses: expData.totalExpenditure,
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
    trendMap[key] = { month: key, sales: item.sales, expenses: 0, profit: item.sales };
  });

  expTrend.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
    if (!trendMap[key]) {
      trendMap[key] = { month: key, sales: 0, expenses: item.expenditure, profit: -item.expenditure };
    } else {
      trendMap[key].expenses = item.expenditure;
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

// Daily chart data for the last N days
export const getChartData = async (days = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const matchStage = { date: { $gte: startDate, $lte: endDate } };

  const salesByDay = await Sale.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        sales: { $sum: "$grandTotal" },
      },
    },
  ]);

  const expByDay = await Expenditure.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        expenses: { $sum: "$amount" },
      },
    },
  ]);

  const dayMap = {};
  salesByDay.forEach((d) => {
    dayMap[d._id] = { date: d._id, sales: d.sales, expenses: 0 };
  });
  expByDay.forEach((d) => {
    if (!dayMap[d._id]) dayMap[d._id] = { date: d._id, sales: 0, expenses: d.expenses };
    else dayMap[d._id].expenses = d.expenses;
  });

  return Object.values(dayMap).sort((a, b) => (a.date > b.date ? 1 : -1));
};

// Top items shaped for the frontend TopItem type
export const getTopItemsForDashboard = async (matchStage = {}) => {
  const topItems = await Sale.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.itemName",
        ordersCount: { $sum: "$items.quantity" },
      },
    },
    { $sort: { ordersCount: -1 } },
    { $limit: 10 },
  ]);

  const maxOrders = topItems.length ? topItems[0].ordersCount : 0;

  // Join with MenuItem to get category
  const names = topItems.map((t) => t._id);
  const menuItems = await MenuItem.find({ name: { $in: names } }).select("name category");
  const categoryMap = {};
  menuItems.forEach((m) => { categoryMap[m.name] = m.category; });

  return topItems.map((item) => ({
    _id: item._id,
    name: item._id,
    category: categoryMap[item._id] || "Uncategorized",
    ordersCount: item.ordersCount,
    maxOrders,
  }));
};

// Recent sales
export const getRecentSales = async (limit = 10) => {
  const sales = await Sale.find({})
    .sort({ date: -1 })
    .limit(limit)
    .select("invoiceId customerName grandTotal paymentStatus date");

  return sales.map((s) => ({
    _id: s._id,
    invoiceId: s.invoiceId,
    customerName: s.customerName,
    amount: s.grandTotal,
    status: s.paymentStatus,
    date: s.date,
  }));
};