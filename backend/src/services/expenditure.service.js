import { Expenditure } from "../models/Expenditure.js";
import { ApiError } from "../utils/ApiError.js";

export const getExpenditures = async ({
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

  const expenditures = await Expenditure.find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Expenditure.countDocuments(query);

  return {
    expenditures,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

export const getExpenditureById = async (id) => {
  const expenditure = await Expenditure.findById(id);
  if (!expenditure) {
    throw new ApiError(404, "Expenditure not found");
  }
  return expenditure;
};

export const createExpenditure = async (data) => {
  return await Expenditure.create(data);
};

export const updateExpenditure = async (id, data) => {
  const expenditure = await Expenditure.findById(id);
  if (!expenditure) {
    throw new ApiError(404, "Expenditure not found");
  }

  Object.assign(expenditure, data);
  return await expenditure.save();
};

export const deleteExpenditure = async (id) => {
  const expenditure = await Expenditure.findById(id);
  if (!expenditure) {
    throw new ApiError(404, "Expenditure not found");
  }

  await Expenditure.findByIdAndDelete(id);
  return expenditure;
};
