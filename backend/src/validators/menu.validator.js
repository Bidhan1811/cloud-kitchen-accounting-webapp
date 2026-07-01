import { ApiError } from "../utils/ApiError.js";

export const validateCreateMenuItem = (data) => {
  const { name, price } = data;
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Valid dish name is required");
  }
  if (price === undefined || typeof price !== "number" || price < 0) {
    throw new ApiError(400, "Valid price is required and cannot be negative");
  }
};

export const validateUpdateMenuItem = (data) => {
  const { name, price, isActive } = data;
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    throw new ApiError(400, "Valid dish name is required if provided");
  }
  if (price !== undefined && (typeof price !== "number" || price < 0)) {
    throw new ApiError(400, "Valid price is required if provided and cannot be negative");
  }
  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }
};
