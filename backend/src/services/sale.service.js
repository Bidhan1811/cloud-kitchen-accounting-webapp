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
    .populate("customer", "name phone address totalOrders totalSpend")
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
  const sale = await Sale.findById(id).populate("customer", "name phone address totalOrders totalSpend");
  if (!sale) {
    throw new ApiError(404, "Sale not found");
  }
  return sale;
};

/**
 * Finds a customer by phone, or creates one if this is their first sale.
 * This is the single place "new customer" logic lives — both createSale and
 * updateSale (when reassigning a sale to a different phone) go through here.
 * Returns the full Customer document so callers have its _id for the hard
 * link on Sale.customer.
 */
const findOrCreateCustomer = async ({ name, phone, address }) => {
  let customer = await Customer.findOne({ phone });
  if (!customer) {
    customer = await Customer.create({
      name: name?.trim() || "Walk-in Customer",
      phone,
      address: address?.trim() || "",
    });
  } else if (address && address.trim() && !customer.address) {
    // Backfill address if the customer didn't have one on file yet
    customer.address = address.trim();
    await customer.save();
  }
  return customer;
};

export const createSale = async (data) => {
  const { items, customerId, customerName, customerPhone, customerAddress, ...restData } = data;

  // Snapshot Pricing logic: fetch real prices for standard items from MenuMaster.
  // Prefer looking up by menuItem id (stable) over name (fragile — breaks if the
  // menu item is renamed after being picked in the form).
  const processedItems = await Promise.all(
    items.map(async (item) => {
      if (item.isCustom) {
        return {
          ...item,
          lineTotal: item.quantity * item.unitPrice,
        };
      }

      const menuItem = item.menuItem
        ? await MenuItem.findById(item.menuItem)
        : await MenuItem.findOne({ name: item.itemName });

      if (!menuItem) {
        throw new ApiError(
          400,
          `Menu item '${item.itemName}' not found in master list. Mark as custom if it's a new item.`
        );
      }
      return {
        ...item,
        unitPrice: menuItem.price, // Trust backend price snapshot
        lineTotal: item.quantity * menuItem.price,
      };
    })
  );

  // If the frontend's autocomplete dropdown was used to pick an existing
  // customer, trust that id directly rather than re-deriving it from phone —
  // faster, and avoids any ambiguity if phone formatting differs slightly.
  // Otherwise (new customer, typed manually) fall back to find-or-create by
  // phone. Either way the customer is resolved BEFORE the sale is created,
  // so a brand-new customer always exists in the Customer collection — and
  // has an _id to hard-link — by the time the sale is saved. This is the fix
  // for the original bug (new-customer sales 400ing).
  let customer;
  if (customerId) {
    customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ApiError(404, "Selected customer not found");
    }
  } else {
    const phone = customerPhone.trim();
    customer = await findOrCreateCustomer({
      name: customerName,
      phone,
      address: customerAddress,
    });
  }

  const salePayload = {
    ...restData,
    customer: customer._id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerAddress: customer.address,
    items: processedItems,
  };

  const newSale = await Sale.create(salePayload);

  // Update aggregates. amountPaid on the sale already reflects Paid/Partial/Unpaid
  // correctly thanks to the pre-validate hook on the Sale model.
  customer.totalOrders += 1;
  customer.totalSpend += newSale.grandTotal;
  await customer.save();

  return newSale;
};

export const updateSale = async (id, data) => {
  const sale = await Sale.findById(id);
  if (!sale) {
    throw new ApiError(404, "Sale not found");
  }

  const oldGrandTotal = sale.grandTotal;
  const oldCustomerId = sale.customer;

  if (data.items) {
    const processedItems = await Promise.all(
      data.items.map(async (item) => {
        if (item.isCustom) {
          return item;
        }
        const menuItem = item.menuItem
          ? await MenuItem.findById(item.menuItem)
          : await MenuItem.findOne({ name: item.itemName });

        if (!menuItem) {
          throw new ApiError(400, `Menu item '${item.itemName}' not found.`);
        }
        return {
          ...item,
          unitPrice: menuItem.price,
        };
      })
    );
    data.items = processedItems;
  }

  // If the phone number is changing, resolve/create the new customer up front
  // and re-point the hard link before saving.
  let newCustomer = null;
  if (data.customerPhone && data.customerPhone.trim() !== sale.customerPhone) {
    newCustomer = await findOrCreateCustomer({
      name: data.customerName ?? sale.customerName,
      phone: data.customerPhone.trim(),
      address: data.customerAddress,
    });
    data.customer = newCustomer._id;
    data.customerPhone = newCustomer.phone;
    data.customerName = newCustomer.name;
    data.customerAddress = newCustomer.address;
  }

  Object.assign(sale, data);
  const updatedSale = await sale.save();

  const diff = updatedSale.grandTotal - oldGrandTotal;

  if (!newCustomer) {
    // Same customer — just adjust their totalSpend if the amount changed
    if (diff !== 0 && oldCustomerId) {
      await Customer.updateOne(
        { _id: oldCustomerId },
        { $inc: { totalSpend: diff } }
      );
    }
  } else {
    // Sale was reassigned to a different customer — back the old one out,
    // apply the full new amount to the new one.
    if (oldCustomerId) {
      await Customer.updateOne(
        { _id: oldCustomerId },
        { $inc: { totalOrders: -1, totalSpend: -oldGrandTotal } }
      );
    }
    newCustomer.totalOrders += 1;
    newCustomer.totalSpend += updatedSale.grandTotal;
    await newCustomer.save();
  }

  return updatedSale;
};

export const deleteSale = async (id) => {
  const sale = await Sale.findById(id);
  if (!sale) {
    throw new ApiError(404, "Sale not found");
  }

  const grandTotal = sale.grandTotal;
  const customerId = sale.customer;

  await Sale.findByIdAndDelete(id);

  // Decouple customer aggregates
  if (customerId) {
    await Customer.updateOne(
      { _id: customerId },
      { $inc: { totalOrders: -1, totalSpend: -grandTotal } }
    );
  }

  return sale;
};