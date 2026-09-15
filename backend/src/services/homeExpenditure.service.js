import { HomeExpenditure } from "../models/HomeExpenditure.js";
import { ApiError } from "../utils/ApiError.js";

export const getHomeExpenditures = async ({
  search,
  startDate,
  endDate,
  datePreset,
  category,
  minAmount,
  maxAmount,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  if (search) {
    query.$or = [
      { homeExpenseId: { $regex: search, $options: "i" } },
      { items: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } },
    ];
  }

  if (datePreset && datePreset !== "all") {
    const now = new Date();
    if (datePreset === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (datePreset === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      query.date = { $gte: startOfWeek };
    } else if (datePreset === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.date = { $gte: startOfMonth };
    }
  } else if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (startDate) {
    query.date = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.date = { $lte: new Date(endDate) };
  }

  if (category && category !== "All") {
    query.category = category;
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) query.amount.$gte = Number(minAmount);
    if (maxAmount !== undefined) query.amount.$lte = Number(maxAmount);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const homeExpenditures = await HomeExpenditure.find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await HomeExpenditure.countDocuments(query);

  return {
    homeExpenditures,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

export const getHomeExpenditureById = async (id) => {
  const homeExpenditure = await HomeExpenditure.findById(id);
  if (!homeExpenditure) {
    throw new ApiError(404, "Home expense not found");
  }
  return homeExpenditure;
};

export const createHomeExpenditure = async (data) => {
  return await HomeExpenditure.create(data);
};

export const updateHomeExpenditure = async (id, data) => {
  const homeExpenditure = await HomeExpenditure.findById(id);
  if (!homeExpenditure) {
    throw new ApiError(404, "Home expense not found");
  }

  Object.assign(homeExpenditure, data);
  return await homeExpenditure.save();
};

export const deleteHomeExpenditure = async (id) => {
  const homeExpenditure = await HomeExpenditure.findById(id);
  if (!homeExpenditure) {
    throw new ApiError(404, "Home expense not found");
  }

  await HomeExpenditure.findByIdAndDelete(id);
  return homeExpenditure;
};
