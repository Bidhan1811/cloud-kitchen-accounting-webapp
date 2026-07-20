import { ApiError } from "../utils/ApiError.js";

const VALID_PAYMENT_MODES = ["Cash", "UPI", "Card", "Credit"];
const VALID_PAYMENT_STATUSES = ["Paid", "Unpaid", "Partial"];

export const validateCreateSale = (data) => {
  const {
    customerName,
    customerPhone,
    items,
    paymentStatus,
    paymentMode,
    deliveryCharge,
    amountPaid,
  } = data;

  if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
    throw new ApiError(400, "Customer name is required");
  }

  if (!customerPhone || typeof customerPhone !== "string" || !customerPhone.trim()) {
    throw new ApiError(400, "Customer phone is required");
  }

  if (!/^[0-9]{10}$/.test(customerPhone.trim())) {
    throw new ApiError(400, "Enter a valid 10-digit phone number");
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
    if (item.unitPrice === undefined || item.unitPrice < 0) {
      throw new ApiError(400, "A valid unit price is required for all items");
    }
    if (item.portion !== undefined && !["full", "half"].includes(item.portion)) {
      throw new ApiError(400, "Item portion must be 'full' or 'half'");
    }
  }

  if (!paymentStatus || !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new ApiError(400, "Payment status must be 'Paid', 'Unpaid', or 'Partial'");
  }

  if (
    (paymentStatus === "Paid" || paymentStatus === "Partial") &&
    (!paymentMode || !VALID_PAYMENT_MODES.includes(paymentMode))
  ) {
    throw new ApiError(400, "Valid payment mode is required when status is Paid or Partial");
  }

  if (paymentStatus === "Partial") {
    if (amountPaid === undefined || typeof amountPaid !== "number" || amountPaid <= 0) {
      throw new ApiError(400, "Amount paid is required and must be greater than 0 for a Partial payment");
    }
  }

  if (deliveryCharge !== undefined && (typeof deliveryCharge !== "number" || deliveryCharge < 0)) {
    throw new ApiError(400, "Delivery charge cannot be negative");
  }
};

export const validateUpdateSale = (data) => {
  const { paymentStatus, paymentMode, amountPaid } = data;

  if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new ApiError(400, "Payment status must be 'Paid', 'Unpaid', or 'Partial'");
  }

  if (
    (paymentStatus === "Paid" || paymentStatus === "Partial") &&
    (!paymentMode || !VALID_PAYMENT_MODES.includes(paymentMode))
  ) {
    throw new ApiError(400, "Valid payment mode is required when status is Paid or Partial");
  }

  if (paymentStatus === "Partial") {
    if (amountPaid === undefined || typeof amountPaid !== "number" || amountPaid <= 0) {
      throw new ApiError(400, "Amount paid is required and must be greater than 0 for a Partial payment");
    }
  }
};