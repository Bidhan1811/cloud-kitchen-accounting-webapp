import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as saleService from "../services/sale.service.js";
import { validateCreateSale, validateUpdateSale, validatePatchPayment } from "../validators/sale.validator.js";

export const getSales = asyncHandler(async (req, res) => {
  const salesData = await saleService.getSales(req.query);
  return res.status(200).json(new ApiResponse(200, salesData, "Sales fetched successfully"));
});

export const getSaleById = asyncHandler(async (req, res) => {
  const sale = await saleService.getSaleById(req.params.id);
  return res.status(200).json(new ApiResponse(200, sale, "Sale fetched successfully"));
});

export const createSale = asyncHandler(async (req, res) => {
  validateCreateSale(req.body);
  const sale = await saleService.createSale(req.body);
  return res.status(201).json(new ApiResponse(201, sale, "Sale created successfully"));
});

export const updateSale = asyncHandler(async (req, res) => {
  validateUpdateSale(req.body);
  const sale = await saleService.updateSale(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, sale, "Sale updated successfully"));
});

export const patchPayment = asyncHandler(async (req, res) => {
  validatePatchPayment(req.body);
  const sale = await saleService.patchPayment(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, sale, "Payment updated successfully"));
});

export const deleteSale = asyncHandler(async (req, res) => {
  await saleService.deleteSale(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, "Sale deleted successfully"));
});
