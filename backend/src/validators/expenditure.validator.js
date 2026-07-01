import { ApiError } from "../utils/ApiError.js";

export const validateCreateExpenditure = (data) => {
  const { category, items, amount } = data;
  
  if (!category || typeof category !== "string" || !category.trim()) {
    throw new ApiError(400, "Category is required");
  }
  
  if (!items || typeof items !== "string" || !items.trim()) {
    throw new ApiError(400, "Item description is required");
  }

  if (amount === undefined || typeof amount !== "number" || amount < 0) {
    throw new ApiError(400, "Valid amount is required and cannot be negative");
  }
};

export const validateUpdateExpenditure = (data) => {
  const { category, items, amount } = data;
  
  if (category !== undefined && (typeof category !== "string" || !category.trim())) {
    throw new ApiError(400, "Valid category is required if provided");
  }

  if (items !== undefined && (typeof items !== "string" || !items.trim())) {
    throw new ApiError(400, "Valid item description is required if provided");
  }

  if (amount !== undefined && (typeof amount !== "number" || amount < 0)) {
    throw new ApiError(400, "Valid amount is required if provided and cannot be negative");
  }
};
