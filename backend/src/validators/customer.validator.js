import { ApiError } from "../utils/ApiError.js";

export const validateCreateCustomer = (data) => {
  const { name, phone } = data;
  
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Customer name is required");
  }
  
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    throw new ApiError(400, "Phone number is required");
  }
};

export const validateUpdateCustomer = (data) => {
  const { name, phone } = data;
  
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    throw new ApiError(400, "Valid customer name is required if provided");
  }

  if (phone !== undefined && (typeof phone !== "string" || !phone.trim())) {
    throw new ApiError(400, "Valid phone number is required if provided");
  }
};
