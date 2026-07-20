import { MenuItem } from "../models/MenuItem.js";
import { Sale } from "../models/Sale.js";
import { ApiError } from "../utils/ApiError.js";

export const getMenuItems = async ({ search, category, activeOnly = true, page = 1, limit = 10 }) => {
  const query = {};

  // activeOnly can arrive as a boolean (default) or a string (from query params)
  const isActiveOnly = activeOnly === true || activeOnly === "true";
  if (isActiveOnly) {
    query.isActive = true;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (category) {
    query.category = category;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    MenuItem.find(query)
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(limitNum),
    MenuItem.countDocuments(query),
  ]);

  return {
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const createMenuItem = async (data) => {
  const existingItem = await MenuItem.findOne({ name: data.name.trim() });
  if (existingItem) {
    throw new ApiError(409, "A menu item with this name already exists");
  }

  return await MenuItem.create(data);
};

export const updateMenuItem = async (id, data) => {
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new ApiError(404, "Menu item not found");
  }

  if (data.name) {
    const existingItem = await MenuItem.findOne({ name: data.name.trim(), _id: { $ne: id } });
    if (existingItem) {
      throw new ApiError(409, "A menu item with this name already exists");
    }
  }

  Object.assign(item, data);
  return await item.save();
};

export const deleteMenuItem = async (id) => {
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new ApiError(404, "Menu item not found");
  }

  // Check if item was ever used in a sale
  // The sale items are embedded, but we can search for the itemName
  const usedInSale = await Sale.findOne({ "items.itemName": item.name });

  if (usedInSale) {
    // Soft disable instead of deleting
    item.isActive = false;
    await item.save();
    return { deleted: false, deactivated: true, item };
  }

  // If never used, permanently delete
  await MenuItem.findByIdAndDelete(id);
  return { deleted: true, deactivated: false, item };
};
