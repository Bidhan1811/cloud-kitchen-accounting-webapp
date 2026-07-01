import { MenuItem } from "../models/MenuItem.js";
import { Sale } from "../models/Sale.js";
import { ApiError } from "../utils/ApiError.js";

export const getMenuItems = async ({ search, category, activeOnly = true }) => {
  const query = {};
  
  if (activeOnly) {
    query.isActive = true;
  } else if (activeOnly === false || activeOnly === "false") {
    // If explicitly asked for all, don't filter by isActive
    // Wait, the param could be a string if coming from query params
    // Let's handle it
  }

  if (activeOnly === "true") {
    query.isActive = true;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  
  if (category) {
    query.category = category;
  }

  return await MenuItem.find(query).sort({ category: 1, name: 1 });
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
