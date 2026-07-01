import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as expenditureService from "../services/expenditure.service.js";
import { validateCreateExpenditure, validateUpdateExpenditure } from "../validators/expenditure.validator.js";

export const getExpenditures = asyncHandler(async (req, res) => {
  const data = await expenditureService.getExpenditures(req.query);
  return res.status(200).json(new ApiResponse(200, data, "Expenditures fetched successfully"));
});

export const getExpenditureById = asyncHandler(async (req, res) => {
  const expenditure = await expenditureService.getExpenditureById(req.params.id);
  return res.status(200).json(new ApiResponse(200, expenditure, "Expenditure fetched successfully"));
});

export const createExpenditure = asyncHandler(async (req, res) => {
  validateCreateExpenditure(req.body);
  const expenditure = await expenditureService.createExpenditure(req.body);
  return res.status(201).json(new ApiResponse(201, expenditure, "Expenditure created successfully"));
});

export const updateExpenditure = asyncHandler(async (req, res) => {
  validateUpdateExpenditure(req.body);
  const expenditure = await expenditureService.updateExpenditure(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, expenditure, "Expenditure updated successfully"));
});

export const deleteExpenditure = asyncHandler(async (req, res) => {
  await expenditureService.deleteExpenditure(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, "Expenditure deleted successfully"));
});
