import { ApiError } from "../utils/ApiError.js";

export const validateCreateHomeExpenditure = (data) => {
  const { category, items, amount, paymentMode } = data;

  if (!category || typeof category !== "string" || !category.trim()) {
    throw new ApiError(400, "Category is required");
  }

  if (!items || typeof items !== "string" || !items.trim()) {
    throw new ApiError(400, "Item description is required");
  }

  if (amount === undefined || typeof amount !== "number" || amount < 0) {
    throw new ApiError(400, "Valid amount is required and cannot be negative");
  }

  const validPaymentModes = ["cash", "card", "upi", "bank"];
  if (!paymentMode || !validPaymentModes.includes(paymentMode)) {
    throw new ApiError(400, "Valid payment mode is required (cash, card, upi, bank)");
  }
};

export const validateUpdateHomeExpenditure = (data) => {
  const { category, items, amount, paymentMode } = data;

  if (category !== undefined && (typeof category !== "string" || !category.trim())) {
    throw new ApiError(400, "Valid category is required if provided");
  }

  if (items !== undefined && (typeof items !== "string" || !items.trim())) {
    throw new ApiError(400, "Valid item description is required if provided");
  }

  if (amount !== undefined && (typeof amount !== "number" || amount < 0)) {
    throw new ApiError(400, "Valid amount is required if provided and cannot be negative");
  }

  const validPaymentModes = ["cash", "card", "upi", "bank"];
  if (paymentMode !== undefined && !validPaymentModes.includes(paymentMode)) {
    throw new ApiError(400, "Valid payment mode is required if provided");
  }
};
