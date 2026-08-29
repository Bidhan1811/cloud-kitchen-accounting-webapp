import { ApiError } from "../utils/ApiError.js";
import { LEDGER_ADJUSTMENT_TYPES, LEDGER_PAYMENT_MODES } from "../models/LedgerTransaction.js";

export const validateCreatePayment = (data) => {
  const { amount, paymentMode } = data;

  if (amount === undefined || amount === null || typeof amount !== "number" || amount <= 0) {
    throw new ApiError(400, "A valid payment amount greater than 0 is required");
  }

  if (!paymentMode || !Object.values(LEDGER_PAYMENT_MODES).includes(paymentMode)) {
    throw new ApiError(
      400,
      `Payment mode must be one of: ${Object.values(LEDGER_PAYMENT_MODES).join(", ")}`
    );
  }

  if (data.paymentDate !== undefined && isNaN(new Date(data.paymentDate).getTime())) {
    throw new ApiError(400, "Valid payment date is required if provided");
  }
};

export const validateCreateAdjustment = (data) => {
  const { amount, adjustmentType, reason } = data;

  if (amount === undefined || amount === null || typeof amount !== "number" || amount <= 0) {
    throw new ApiError(400, "A valid adjustment amount greater than 0 is required");
  }

  if (!adjustmentType || !Object.values(LEDGER_ADJUSTMENT_TYPES).includes(adjustmentType)) {
    throw new ApiError(400, "adjustmentType must be DEBIT or CREDIT");
  }

  if (!reason || typeof reason !== "string" || !reason.trim()) {
    throw new ApiError(400, "A reason/description is required for every adjustment");
  }
};

export const validateLedgerQuery = (query) => {
  const { startDate, endDate } = query;

  if (startDate !== undefined && isNaN(new Date(startDate).getTime())) {
    throw new ApiError(400, "Valid startDate is required if provided");
  }
  if (endDate !== undefined && isNaN(new Date(endDate).getTime())) {
    throw new ApiError(400, "Valid endDate is required if provided");
  }
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    throw new ApiError(400, "startDate must be before endDate");
  }
};

export const validateMonthlyQuery = (query) => {
  const { year, month } = query;

  const yearNum = Number(year);
  const monthNum = Number(month);

  if (!year || isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    throw new ApiError(400, "A valid year is required (e.g. 2026)");
  }

  if (!month || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new ApiError(400, "A valid month between 1 and 12 is required");
  }
};