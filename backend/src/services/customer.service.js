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

  return {
    customers,
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

  // Fetch full order history joined from Sales
  const orderHistory = await Sale.find({ customerPhone: customer.phone }).sort({ date: -1 });

  return {
    profile: customer,
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
    
    // If phone number changes, we should ideally update all their past sales to reflect the new phone number
    // since we use customerPhone as the foreign key in Sale model.
    if (data.phone !== customer.phone) {
      await Sale.updateMany(
        { customerPhone: customer.phone },
        { $set: { customerPhone: data.phone } }
      );
    }
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
