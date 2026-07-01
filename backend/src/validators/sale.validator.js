import { ApiError } from "../utils/ApiError.js";

export const validateCreateSale = (data) => {
  const { customerName, customerPhone, items, paymentStatus, paymentMode, deliveryCharge } = data;
  
  if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
    throw new ApiError(400, "Customer name is required");
  }
  
  if (!customerPhone || typeof customerPhone !== "string" || !customerPhone.trim()) {
    throw new ApiError(400, "Customer phone is required");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "A Sale must have at least one item");
  }

  for (const item of items) {
    if (!item.itemName || !item.itemName.trim()) {
      throw new ApiError(400, "Item name is required for all items");
    }
    if (!item.quantity || item.quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1 for all items");
    }
    if (item.isCustom) {
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        throw new ApiError(400, "Custom items require a valid unit price");
      }
    }
  }

  if (!paymentStatus || !["Paid", "Unpaid"].includes(paymentStatus)) {
    throw new ApiError(400, "Payment status must be 'Paid' or 'Unpaid'");
  }

  if (paymentStatus === "Paid" && (!paymentMode || !["Cash", "UPI", "Card", "Bank Transfer", "Other"].includes(paymentMode))) {
    throw new ApiError(400, "Valid payment mode is required when status is Paid");
  }

  if (deliveryCharge !== undefined && (typeof deliveryCharge !== "number" || deliveryCharge < 0)) {
    throw new ApiError(400, "Delivery charge cannot be negative");
  }
};

export const validateUpdateSale = (data) => {
  const { paymentStatus, paymentMode } = data;
  
  if (paymentStatus && !["Paid", "Unpaid"].includes(paymentStatus)) {
    throw new ApiError(400, "Payment status must be 'Paid' or 'Unpaid'");
  }

  if (paymentStatus === "Paid" && (!paymentMode || !["Cash", "UPI", "Card", "Bank Transfer", "Other"].includes(paymentMode))) {
    throw new ApiError(400, "Valid payment mode is required when status is Paid");
  }
};
