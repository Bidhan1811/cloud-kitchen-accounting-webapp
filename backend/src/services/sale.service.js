import { Sale } from "../models/Sale.js";
import { Customer } from "../models/Customer.js";
import { MenuItem } from "../models/MenuItem.js";
import { ApiError } from "../utils/ApiError.js";

export const getSales = async ({
  startDate,
  endDate,
  customerName,
  itemName,
  paymentStatus,
  paymentMode,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (startDate) {
    query.date = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.date = { $lte: new Date(endDate) };
  }

  if (customerName) {
    query.customerName = { $regex: customerName, $options: "i" };
  }

  if (itemName) {
    query["items.itemName"] = { $regex: itemName, $options: "i" };
  }

  if (paymentStatus && paymentStatus !== "All") {
    query.paymentStatus = paymentStatus;
  }

  if (paymentMode && paymentMode !== "All") {
    query.paymentMode = paymentMode;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const sales = await Sale.find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Sale.countDocuments(query);

  return {
    sales,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

export const getSaleById = async (id) => {
  const sale = await Sale.findById(id);
  if (!sale) {
    throw new ApiError(404, "Sale not found");
  }
  return sale;
};

export const createSale = async (data) => {
  const { items, customerName, customerPhone, ...restData } = data;

  // Snapshot Pricing logic: fetch real prices for standard items from MenuMaster
  const processedItems = await Promise.all(
    items.map(async (item) => {
      if (item.isCustom) {
        return {
          ...item,
          lineTotal: item.quantity * item.unitPrice, // Handled in pre-save anyway, but good to have
        };
      } else {
        const menuItem = await MenuItem.findOne({ name: item.itemName });
        if (!menuItem) {
          throw new ApiError(400, `Menu item '${item.itemName}' not found in master list. Mark as custom if it's a new item.`);
        }
        return {
          ...item,
          unitPrice: menuItem.price, // Trust backend price snapshot
          lineTotal: item.quantity * menuItem.price,
        };
      }
    })
  );

  const salePayload = {
    ...restData,
    customerName,
    customerPhone,
    items: processedItems,
  };

  const newSale = await Sale.create(salePayload);

  // Auto-create/update customer logic
  let customer = await Customer.findOne({ phone: customerPhone });
  if (!customer) {
    customer = await Customer.create({
      name: customerName,
      phone: customerPhone,
      totalOrders: 1,
      totalSpend: newSale.grandTotal,
    });
  } else {
    // If name differs significantly, could update name, but we will just update aggregates for now
    customer.totalOrders += 1;
    customer.totalSpend += newSale.grandTotal;
    await customer.save();
  }

  return newSale;
};

export const updateSale = async (id, data) => {
  const sale = await Sale.findById(id);
  if (!sale) {
    throw new ApiError(404, "Sale not found");
  }

  // Only allow updating payment status/mode, notes, or date for safety. 
  // Editing items requires re-running snapshot logic if we allowed it.
  // The PDF says "PUT /api/sales/:id: Edit a sale (e.g. mark Unpaid -> Paid, fix a typo)."
  // We'll update the provided fields.
  
  if (data.items) {
    // If items are being edited, re-run snapshot logic
    const processedItems = await Promise.all(
      data.items.map(async (item) => {
        if (item.isCustom) {
          return item;
        } else {
          // If unitPrice isn't provided, or to strictly enforce backend price if itemName changes
          const menuItem = await MenuItem.findOne({ name: item.itemName });
          if (!menuItem) {
            throw new ApiError(400, `Menu item '${item.itemName}' not found.`);
          }
          return {
            ...item,
            unitPrice: menuItem.price,
          };
        }
      })
    );
    data.items = processedItems;
  }

  const oldGrandTotal = sale.grandTotal;

  Object.assign(sale, data);
  const updatedSale = await sale.save();

  // If grandTotal changed, adjust customer spend
  if (data.items || data.deliveryCharge !== undefined) {
    const diff = updatedSale.grandTotal - oldGrandTotal;
    if (diff !== 0) {
      await Customer.updateOne(
        { phone: updatedSale.customerPhone },
        { $inc: { totalSpend: diff } }
      );
    }
  }

  return updatedSale;
};

export const deleteSale = async (id) => {
  const sale = await Sale.findById(id);
  if (!sale) {
    throw new ApiError(404, "Sale not found");
  }

  const grandTotal = sale.grandTotal;
  const phone = sale.customerPhone;

  await Sale.findByIdAndDelete(id);

  // Decouple customer aggregates
  await Customer.updateOne(
    { phone },
    { $inc: { totalOrders: -1, totalSpend: -grandTotal } }
  );

  return sale;
};
