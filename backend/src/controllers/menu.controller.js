import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as menuService from "../services/menu.service.js";
import { validateCreateMenuItem, validateUpdateMenuItem } from "../validators/menu.validator.js";

export const getMenuItems = asyncHandler(async (req, res) => {
  const { search, category, activeOnly, page, limit } = req.query;
  const result = await menuService.getMenuItems({ search, category, activeOnly, page, limit });
  return res.status(200).json(new ApiResponse(200, result, "Menu items fetched successfully"));
});

export const createMenuItem = asyncHandler(async (req, res) => {
  validateCreateMenuItem(req.body);
  const item = await menuService.createMenuItem(req.body);
  return res.status(201).json(new ApiResponse(201, item, "Menu item created successfully"));
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  validateUpdateMenuItem(req.body);
  const item = await menuService.updateMenuItem(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, item, "Menu item updated successfully"));
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const result = await menuService.deleteMenuItem(req.params.id);
  const message = result.deleted 
    ? "Menu item permanently deleted" 
    : "Menu item has past sales and was deactivated instead";
  return res.status(200).json(new ApiResponse(200, result, message));
});
