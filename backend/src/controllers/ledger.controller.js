import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as ledgerService from "../services/ledger.service.js";
import {
  validateCreatePayment,
  validateCreateAdjustment,
  validateLedgerQuery,
  validateMonthlyQuery,
} from "../validators/ledger.validator.js";

export const getLedger = asyncHandler(async (req, res) => {
  validateLedgerQuery(req.query);
  const { startDate, endDate } = req.query;
  const ledger = await ledgerService.getCustomerLedger(req.params.customerId, { startDate, endDate });
  const balance = ledgerService.describeBalance(ledger.closingBalance);
  return res
    .status(200)
    .json(new ApiResponse(200, { ...ledger, balance }, "Ledger fetched successfully"));
});

export const getLedgerSummary = asyncHandler(async (req, res) => {
  validateMonthlyQuery(req.query);
  const { year, month } = req.query;
  const summary = await ledgerService.getMonthlyLedgerSummary(req.params.customerId, {
    year: Number(year),
    month: Number(month),
  });
  const balance = ledgerService.describeBalance(summary.closingBalance);
  return res
    .status(200)
    .json(new ApiResponse(200, { ...summary, balance }, "Ledger summary fetched successfully"));
});

export const createPayment = asyncHandler(async (req, res) => {
  validateCreatePayment(req.body);
  const { amount, paymentDate, paymentMode, reference, description } = req.body;

  try {
    const result = await ledgerService.createPayment(req.params.customerId, {
      amount,
      paymentDate,
      paymentMode,
      reference,
      description,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, result, "Payment recorded successfully"));
  } catch (err) {
    // Duplicate-reference is a soft warning, not a hard block — surface it
    // with its distinct code so the frontend can offer "record anyway?".
    // The caller can resubmit with `force: true` to bypass this check.
    if (err.code === "DUPLICATE_PAYMENT_REFERENCE" && req.body.force) {
      const result = await ledgerService.createPayment(req.params.customerId, {
        amount,
        paymentDate,
        paymentMode,
        reference: `${reference} (confirmed duplicate)`,
        description,
      });
      return res
        .status(201)
        .json(new ApiResponse(201, result, "Payment recorded successfully"));
    }
    throw err;
  }
});

export const deletePayment = asyncHandler(async (req, res) => {
  const reversal = await ledgerService.deletePayment(req.params.transactionId);
  return res
    .status(200)
    .json(new ApiResponse(200, reversal, "Payment deleted and reversed successfully"));
});

export const createAdjustment = asyncHandler(async (req, res) => {
  validateCreateAdjustment(req.body);
  const { amount, adjustmentType, reason, transactionDate } = req.body;
  const txn = await ledgerService.createAdjustment(req.params.customerId, {
    amount,
    adjustmentType,
    reason,
    transactionDate,
  });
  return res.status(201).json(new ApiResponse(201, txn, "Adjustment recorded successfully"));
});