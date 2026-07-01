import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as customerService from "../services/customer.service.js";
import { validateCreateCustomer, validateUpdateCustomer } from "../validators/customer.validator.js";

export const getCustomers = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomers(req.query);
  return res.status(200).json(new ApiResponse(200, data, "Customers fetched successfully"));
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomerById(req.params.id);
  return res.status(200).json(new ApiResponse(200, data, "Customer profile fetched successfully"));
});

export const createCustomer = asyncHandler(async (req, res) => {
  validateCreateCustomer(req.body);
  const customer = await customerService.createCustomer(req.body);
  return res.status(201).json(new ApiResponse(201, customer, "Customer created successfully"));
});

export const updateCustomer = asyncHandler(async (req, res) => {
  validateUpdateCustomer(req.body);
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, customer, "Customer updated successfully"));
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, "Customer deleted successfully"));
});
