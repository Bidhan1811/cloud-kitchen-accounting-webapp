import mongoose from "mongoose";
import { Customer } from "../models/Customer.js";
import { Sale } from "../models/Sale.js";
import { LedgerTransaction } from "../models/LedgerTransaction.js";
import { ApiError } from "../utils/ApiError.js";
import {
  calculateCustomerBalance,
  describeBalance,
  createOpeningBalance,
} from "./ledger.service.js";

export const getCustomers = async ({
  search,
  sortBy,
  page = 1,
  limit = 20,
  isCreditCustomer,
}) => {
  const query = {};

  // Allow filtering to only credit customers (used by the Ledger section).
  if (isCreditCustomer !== undefined) {
    query.isCreditCustomer = isCreditCustomer === "true" || isCreditCustomer === true;
  }

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
  // a query per row. This is the EXISTING sale-level outstanding mechanism —
  // untouched, and deliberately separate from the credit ledger balance
  // below. A credit customer can have a nonzero value in both `outstanding`
  // (sale-level) and `creditBalance` (ledger-level) simultaneously; they
  // track different things and are never merged.
  const customerIds = customers.map((c) => c._id);
  const outstandingByCustomer = await Sale.aggregate([
    { $match: { customer: { $in: customerIds }, balanceDue: { $gt: 0 } } },
    { $group: { _id: "$customer", outstanding: { $sum: "$balanceDue" } } },
  ]);
  const outstandingMap = new Map(
    outstandingByCustomer.map((row) => [row._id.toString(), row.outstanding])
  );

  // Credit ledger balances — only meaningful for customers with
  // isCreditCustomer=true, computed for just this page the same way as
  // outstandingByCustomer above (one query, not N+1).
  const creditCustomerIds = customers.filter((c) => c.isCreditCustomer).map((c) => c._id);
  let creditBalanceMap = new Map();
  if (creditCustomerIds.length > 0) {
    const balances = await LedgerTransaction.aggregate([
      { $match: { customerId: { $in: creditCustomerIds } } },
      { $group: { _id: "$customerId", balance: { $sum: "$balanceImpact" } } },
    ]);
    creditBalanceMap = new Map(balances.map((row) => [row._id.toString(), row.balance]));
  }

  const customersWithOutstanding = customers.map((customer) => {
    const base = {
      ...customer.toObject(),
      outstanding: outstandingMap.get(customer._id.toString()) ?? 0,
    };
    if (customer.isCreditCustomer) {
      const rawBalance = creditBalanceMap.get(customer._id.toString()) ?? 0;
      base.creditBalance = describeBalance(rawBalance);
    }
    return base;
  });

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

  // Existing sale-level outstanding — untouched.
  const outstanding = orderHistory.reduce((sum, sale) => sum + (sale.balanceDue || 0), 0);

  const profile = { ...customer.toObject(), outstanding };

  // Credit ledger balance — separate, additive, only present for credit
  // customers. Frontend should display this alongside (not instead of)
  // `outstanding` — see customer.service.js note above.
  if (customer.isCreditCustomer) {
    const rawBalance = await calculateCustomerBalance(customer._id);
    profile.creditBalance = describeBalance(rawBalance);
  }

  return {
    profile,
    orderHistory,
  };
};

export const createCustomer = async (data) => {
  const existingCustomer = await Customer.findOne({ phone: data.phone });
  if (existingCustomer) {
    throw new ApiError(409, "A customer with this phone number already exists");
  }

  const { isCreditCustomer, openingBalance, ...customerData } = data;

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const [customer] = await Customer.create(
        [{ ...customerData, isCreditCustomer: !!isCreditCustomer }],
        { session }
      );

      if (isCreditCustomer && openingBalance && openingBalance > 0) {
        await createOpeningBalance(customer._id, {
          amount: openingBalance,
          session,
        });
      }

      result = customer;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const updateCustomer = async (id, data) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const customer = await Customer.findById(id).session(session);
      if (!customer) {
        throw new ApiError(404, "Customer not found");
      }

      if (data.phone) {
        const existingCustomer = await Customer.findOne({
          phone: data.phone,
          _id: { $ne: id },
        }).session(session);
        if (existingCustomer) {
          throw new ApiError(409, "A customer with this phone number already exists");
        }

        // The hard `customer` ref on Sale means order history/aggregates
        // don't depend on phone matching anymore — but customerPhone is
        // still kept as a denormalized snapshot field for display on
        // historical invoices, so sync it here to keep old sales showing
        // the customer's current number.
        if (data.phone !== customer.phone) {
          await Sale.updateMany(
            { customer: customer._id },
            { $set: { customerPhone: data.phone } },
            { session }
          );
        }
      }

      if (data.name && data.name !== customer.name) {
        await Sale.updateMany(
          { customer: customer._id },
          { $set: { customerName: data.name } },
          { session }
        );
      }

      if (data.address !== undefined && data.address !== customer.address) {
        await Sale.updateMany(
          { customer: customer._id },
          { $set: { customerAddress: data.address } },
          { session }
        );
      }

      // Credit customer toggle. Only meaningful on the transition from
      // false -> true: that's the one moment an opening balance can be
      // recorded (spec section 3/14). Toggling true -> false is allowed
      // (stops future credit sales from affecting the ledger going
      // forward — see sale.service.js/ledger.service.js) but deliberately
      // does NOT delete or reverse existing ledger history; the ledger
      // remains visible/auditable even if the customer is later switched
      // off credit tracking. Re-enabling it later does NOT re-apply an
      // opening balance a second time.
      const { isCreditCustomer, openingBalance, ...restData } = data;
      const wasCredit = customer.isCreditCustomer;

      Object.assign(customer, restData);
      if (isCreditCustomer !== undefined) {
        customer.isCreditCustomer = !!isCreditCustomer;
      }

      const updatedCustomer = await customer.save({ session });

      const justEnabledCredit = !wasCredit && updatedCustomer.isCreditCustomer;
      if (justEnabledCredit && openingBalance && openingBalance > 0) {
        await createOpeningBalance(updatedCustomer._id, {
          amount: openingBalance,
          session,
        });
      }

      result = updatedCustomer;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const deleteCustomer = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  // Spec section 27 — don't allow deletion that leaves orphaned ledger
  // transactions. If this customer has any credit ledger history at all
  // (not just a nonzero balance — a fully-settled credit customer still
  // has an auditable transaction history worth protecting), block deletion
  // outright and point at the outstanding/advance balance so the owner
  // knows what to resolve first. This mirrors "require the outstanding
  // account to be settled before deletion" from the spec, extended
  // slightly to also guard historical records even at a zero balance,
  // since silently deleting a customer with ledger history would orphan
  // those LedgerTransaction documents (customerId pointing at nothing).
  if (customer.isCreditCustomer) {
    const hasLedgerHistory = await LedgerTransaction.exists({ customerId: customer._id });
    if (hasLedgerHistory) {
      const rawBalance = await calculateCustomerBalance(customer._id);
      const balance = describeBalance(rawBalance);
      if (!balance.isSettled) {
        throw new ApiError(
          409,
          `This customer has financial history. ${balance.label}: \u20b9${balance.amount}. Settle the account before deleting this customer.`
        );
      }
      throw new ApiError(
        409,
        "This customer has credit ledger history. Deleting them would orphan that financial record and is not allowed in this version."
      );
    }
  }

  await Customer.findByIdAndDelete(id);
  return customer;
};