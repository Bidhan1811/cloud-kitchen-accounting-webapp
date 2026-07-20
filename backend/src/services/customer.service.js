import { Customer } from "../models/Customer.js";
import { Sale } from "../models/Sale.js";
import { ApiError } from "../utils/ApiError.js";

export const getCustomers = async ({
  search,
  sortBy,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  if (search) {
    // Search by name (using text index) or regex on phone
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === "totalSpend") {
    sortOption = { totalSpend: -1 };
  } else if (sortBy === "totalOrders") {
    sortOption = { totalOrders: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const customers = await Customer.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Customer.countDocuments(query);

  // Outstanding balance isn't stored on Customer — it's derived from Sale
  // documents with a nonzero balanceDue (Unpaid or Partial sales). Computed
  // here in one aggregation covering just this page's customers, rather than
  // a query per row.
  const customerIds = customers.map((c) => c._id);
  const outstandingByCustomer = await Sale.aggregate([
    { $match: { customer: { $in: customerIds }, balanceDue: { $gt: 0 } } },
    { $group: { _id: "$customer", outstanding: { $sum: "$balanceDue" } } },
  ]);
  const outstandingMap = new Map(
    outstandingByCustomer.map((row) => [row._id.toString(), row.outstanding])
  );

  const customersWithOutstanding = customers.map((customer) => ({
    ...customer.toObject(),
    outstanding: outstandingMap.get(customer._id.toString()) ?? 0,
  }));

  return {
    customers: customersWithOutstanding,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

export const getCustomerById = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  // Fetch full order history via the hard customer ref, not phone matching —
  // this is the correct source of truth now that Sale.customer exists, and
  // stays accurate even if the customer's phone number is later changed.
  const orderHistory = await Sale.find({ customer: customer._id }).sort({ date: -1 });

  const outstanding = orderHistory.reduce((sum, sale) => sum + (sale.balanceDue || 0), 0);

  return {
    profile: { ...customer.toObject(), outstanding },
    orderHistory,
  };
};

export const createCustomer = async (data) => {
  const existingCustomer = await Customer.findOne({ phone: data.phone });
  if (existingCustomer) {
    throw new ApiError(409, "A customer with this phone number already exists");
  }

  return await Customer.create(data);
};

export const updateCustomer = async (id, data) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  if (data.phone) {
    const existingCustomer = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
    if (existingCustomer) {
      throw new ApiError(409, "A customer with this phone number already exists");
    }

    // The hard `customer` ref on Sale means order history/aggregates don't
    // depend on phone matching anymore — but customerPhone is still kept as
    // a denormalized snapshot field for display on historical invoices, so
    // sync it here to keep old sales showing the customer's current number.
    // (If you'd rather old invoices freeze at the number used at checkout,
    // remove this block — it's a product choice, not a correctness fix.)
    if (data.phone !== customer.phone) {
      await Sale.updateMany(
        { customer: customer._id },
        { $set: { customerPhone: data.phone } }
      );
    }
  }

  if (data.name && data.name !== customer.name) {
    await Sale.updateMany(
      { customer: customer._id },
      { $set: { customerName: data.name } }
    );
  }

  if (data.address !== undefined && data.address !== customer.address) {
    await Sale.updateMany(
      { customer: customer._id },
      { $set: { customerAddress: data.address } }
    );
  }

  Object.assign(customer, data);
  return await customer.save();
};

export const deleteCustomer = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  await Customer.findByIdAndDelete(id);
  return customer;
};