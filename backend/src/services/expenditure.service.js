import { Expenditure } from "../models/Expenditure.js";
import { ApiError } from "../utils/ApiError.js";

export const getExpenditures = async ({
  startDate,
  endDate,
  category,
  minAmount,
  maxAmount,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  if (startDate && endDate) {
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
