import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as homeExpenditureService from "../services/homeExpenditure.service.js";
import { validateCreateHomeExpenditure, validateUpdateHomeExpenditure } from "../validators/homeExpenditure.validator.js";

export const getHomeExpenditures = asyncHandler(async (req, res) => {
  const data = await homeExpenditureService.getHomeExpenditures(req.query);
  return res.status(200).json(new ApiResponse(200, data, "Home expenses fetched successfully"));
});

export const getHomeExpenditureById = asyncHandler(async (req, res) => {
  const homeExpenditure = await homeExpenditureService.getHomeExpenditureById(req.params.id);
  return res.status(200).json(new ApiResponse(200, homeExpenditure, "Home expense fetched successfully"));
});

export const createHomeExpenditure = asyncHandler(async (req, res) => {
  validateCreateHomeExpenditure(req.body);
  const homeExpenditure = await homeExpenditureService.createHomeExpenditure(req.body);
  return res.status(201).json(new ApiResponse(201, homeExpenditure, "Home expense created successfully"));
});

export const updateHomeExpenditure = asyncHandler(async (req, res) => {
  validateUpdateHomeExpenditure(req.body);
  const homeExpenditure = await homeExpenditureService.updateHomeExpenditure(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, homeExpenditure, "Home expense updated successfully"));
});

export const deleteHomeExpenditure = asyncHandler(async (req, res) => {
  await homeExpenditureService.deleteHomeExpenditure(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, "Home expense deleted successfully"));
});
