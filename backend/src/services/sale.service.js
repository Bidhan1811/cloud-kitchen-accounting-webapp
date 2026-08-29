import mongoose from "mongoose";
import { Sale } from "../models/Sale.js";
import { Customer } from "../models/Customer.js";
import { MenuItem } from "../models/MenuItem.js";
import { ApiError } from "../utils/ApiError.js";
import { generateInvoiceNumber } from "./invoiceNumber.service.js";
import {
  ensureCreditCustomer,
  syncSaleWithLedger,
  createOpeningBalance,
  reverseTransaction,
  calculateCustomerBalance,
  settleSalesFromAdvance,
} from "./ledger.service.js";
import { LedgerTransaction } from "../models/LedgerTransaction.js";

export const getSales = async ({
  search,
  status,
  paymentMode,
  startDate,
  endDate,
  datePreset,
  minAmount,
  maxAmount,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: "i" } },
      { invoiceId: { $regex: search, $options: "i" } },
      { "items.itemName": { $regex: search, $options: "i" } },
    ];
  }

  if (datePreset && datePreset !== "all") {
    const now = new Date();
    if (datePreset === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (datePreset === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      query.date = { $gte: startOfWeek };
    } else if (datePreset === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.date = { $gte: startOfMonth };
    }
  } else if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (startDate) {
    query.date = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.date = { $lte: new Date(endDate) };
  }

  if (status) {
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    query.paymentStatus = formattedStatus;
  }

  if (paymentMode) {
    const formattedMode = paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1).toLowerCase();
    query.paymentMode = formattedMode === "Upi" ? "UPI" : formattedMode;
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    query.grandTotal = {};
    if (minAmount !== undefined) query.grandTotal.$gte = Number(minAmount);
    if (maxAmount !== undefined) query.grandTotal.$lte = Number(maxAmount);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const sales = await Sale.find(query)
    .populate("customer", "name phone address totalOrders totalSpend isCreditCustomer")
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
  const sale = await Sale.findById(id).populate("customer", "name phone address totalOrders totalSpend isCreditCustomer");
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
const findOrCreateCustomer = async ({ name, phone, address }, { session } = {}) => {
  let customer = await Customer.findOne({ phone }).session(session ?? null);
  if (!customer) {
    const [created] = await Customer.create(
      [
        {
          name: name?.trim() || "Walk-in Customer",
          phone,
          address: address?.trim() || "",
        },
      ],
      { session }
    );
    customer = created;
  } else if (address && address.trim() && !customer.address) {
    // Backfill address if the customer didn't have one on file yet
    customer.address = address.trim();
    await customer.save({ session });
  }
  return customer;
};

export const createSale = async (data) => {
  const {
    items,
    customerId,
    customerName,
    customerPhone,
    customerAddress,
    confirmEnableCredit,
    creditOpeningBalance,
    ...restData
  } = data;

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      // Snapshot Pricing logic: fetch real prices for standard items from
      // MenuMaster. Prefer looking up by menuItem id (stable) over name
      // (fragile — breaks if the menu item is renamed after being picked
      // in the form).
      const processedItems = await Promise.all(
        items.map(async (item) => {
          if (item.isCustom) {
            return {
              ...item,
              lineTotal: item.quantity * item.unitPrice,
            };
          }

          const menuItem = item.menuItem
            ? await MenuItem.findById(item.menuItem).session(session)
            : await MenuItem.findOne({ name: item.itemName }).session(session);

          if (!menuItem) {
            throw new ApiError(
              400,
              `Menu item '${item.itemName}' not found in master list. Mark as custom if it's a new item.`
            );
          }

          const isHalf = item.portion === "half";
          if (isHalf && (menuItem.halfPrice === undefined || menuItem.halfPrice === null)) {
            throw new ApiError(
              400,
              `Menu item '${item.itemName}' does not have a half-plate option.`
            );
          }

          const masterPrice = isHalf ? menuItem.halfPrice : menuItem.price;
          const finalPrice = item.unitPrice !== undefined ? item.unitPrice : masterPrice;

          return {
            ...item,
            unitPrice: finalPrice,
            lineTotal: item.quantity * finalPrice,
          };
        })
      );

      // If the frontend's autocomplete dropdown was used to pick an existing
      // customer, trust that id directly rather than re-deriving it from
      // phone — faster, and avoids any ambiguity if phone formatting
      // differs slightly. Otherwise (new customer, typed manually) fall
      // back to find-or-create by phone. Either way the customer is
      // resolved BEFORE the sale is created, so a brand-new customer always
      // exists in the Customer collection — and has an _id to hard-link —
      // by the time the sale is saved.
      let customer;
      if (customerId) {
        customer = await Customer.findById(customerId).session(session);
        if (!customer) {
          throw new ApiError(404, "Selected customer not found");
        }
      } else {
        const phone = customerPhone.trim();
        customer = await findOrCreateCustomer(
          { name: customerName, phone, address: customerAddress },
          { session }
        );
      }

      // Credit opt-in gate — must happen BEFORE the sale is created so the
      // confirmation flow can surface to the user without a half-created
      // sale left behind. See ledger.service.js CreditOptInRequiredError.
      //
      // settledFromAdvance is computed here (if applicable) but deliberately
      // NOT applied to restData/salePayload yet — the sale is first created
      // and synced to the ledger using its TRUE original paymentStatus, so
      // syncSaleWithLedger creates a SALE transaction for the full deferred
      // amount (which is what correctly draws the customer's advance back
      // down). Only AFTER that sync do we patch the Sale document's own
      // paymentStatus/amountPaid to reflect that it was effectively settled
      // from advance — this is purely cosmetic/reporting on the Sale record
      // and never changes what the ledger transaction itself recorded.
      let settledFromAdvance = null;

      if (restData.paymentMode === "Credit") {
        const wasAlreadyCredit = customer.isCreditCustomer;
        customer = await ensureCreditCustomer(customer._id, {
          confirmEnableCredit,
          session,
        });

        // Opening balance only makes sense the moment credit tracking is
        // first enabled for this customer — never re-applied on subsequent
        // credit sales.
        if (!wasAlreadyCredit && creditOpeningBalance && creditOpeningBalance > 0) {
          await createOpeningBalance(customer._id, {
            amount: creditOpeningBalance,
            transactionDate: restData.date,
            session,
          });
        }

        // Only auto-settle from advance when the caller submitted the sale
        // as fully Unpaid/Credit with no explicit amountPaid of their own —
        // if the frontend already computed an intentional partial cash+
        // credit split, that takes precedence and this is skipped.
        const noExplicitAmountPaid =
          restData.paymentStatus === "Unpaid" || restData.amountPaid === undefined || restData.amountPaid === 0;

        if (noExplicitAmountPaid) {
          const preSaleBalance = await calculateCustomerBalance(customer._id, { session });
          const advanceAvailable = preSaleBalance < 0 ? Math.abs(preSaleBalance) : 0;

          if (advanceAvailable > 0) {
            const itemsTotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
            const grandTotal = itemsTotal + (restData.deliveryCharge || 0);

            settledFromAdvance =
              advanceAvailable >= grandTotal
                ? { paymentStatus: "Paid", amountPaid: grandTotal }
                : { paymentStatus: "Partial", amountPaid: advanceAvailable };
          }
        }
      }

      // Generate the invoice number atomically BEFORE creating the sale,
      // and OUTSIDE the session. If the sale fails, the number is skipped
      // (a gap) — this is intentional per the spec: gaps are acceptable,
      // reuse is not. The counter increment is always permanent.
      const invoiceId = await generateInvoiceNumber(restData.date);

      const salePayload = {
        ...restData,
        invoiceId,
        customer: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        items: processedItems,
      };

      let newSale = (await Sale.create([salePayload], { session }))[0];

      // Update aggregates. amountPaid on the sale already reflects
      // Paid/Partial/Unpaid correctly thanks to the pre-validate hook on
      // the Sale model. This is the EXISTING sale-level outstanding
      // mechanism and is untouched by the credit ledger below.
      customer.totalOrders += 1;
      customer.totalSpend += newSale.grandTotal;
      await customer.save({ session });

      // Credit ledger sync — additive, separate from the aggregates above.
      // No-ops if paymentMode !== "Credit". Runs against the sale's TRUE
      // original paymentStatus/deferred amount, so the SALE transaction
      // correctly carries the full amount and draws down any advance.
      await syncSaleWithLedger(newSale, { session });

      // Now apply the advance-settlement patch (if any) to the Sale
      // document itself. This re-triggers the model's pre-validate hook,
      // which recomputes amountPaid/balanceDue from the new paymentStatus —
      // giving the correct "Paid"/"Partial" display without touching the
      // ledger transaction already created above.
      if (settledFromAdvance) {
        newSale.paymentStatus = settledFromAdvance.paymentStatus;
        newSale.amountPaid = settledFromAdvance.amountPaid;
        newSale = await newSale.save({ session });
      }

      // Sweep any OTHER outstanding Credit sales for this customer too —
      // covers the case where multiple sales are created in sequence and
      // advance should carry over/settle earlier still-outstanding sales
      // as well, not just this newest one.
      await settleSalesFromAdvance(customer._id, { session });

      result = newSale;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const updateSale = async (id, data) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const sale = await Sale.findById(id).session(session);
      if (!sale) {
        throw new ApiError(404, "Sale not found");
      }

      const oldGrandTotal = sale.grandTotal;
      const oldCustomerId = sale.customer;

      const { confirmEnableCredit, ...restData } = data;

      if (restData.items) {
        const processedItems = await Promise.all(
          restData.items.map(async (item) => {
            if (item.isCustom) {
              return item;
            }
            const menuItem = item.menuItem
              ? await MenuItem.findById(item.menuItem).session(session)
              : await MenuItem.findOne({ name: item.itemName }).session(session);

            if (!menuItem) {
              throw new ApiError(400, `Menu item '${item.itemName}' not found.`);
            }

            const isHalf = item.portion === "half";
            if (isHalf && (menuItem.halfPrice === undefined || menuItem.halfPrice === null)) {
              throw new ApiError(
                400,
                `Menu item '${item.itemName}' does not have a half-plate option.`
              );
            }

            const masterPrice = isHalf ? menuItem.halfPrice : menuItem.price;
            const finalPrice = item.unitPrice !== undefined ? item.unitPrice : masterPrice;

            return {
              ...item,
              unitPrice: finalPrice,
              lineTotal: item.quantity * finalPrice,
            };
          })
        );
        restData.items = processedItems;
      }

      // If the phone number is changing, resolve/create the new customer up
      // front and re-point the hard link before saving.
      let newCustomer = null;
      if (restData.customerPhone && restData.customerPhone.trim() !== sale.customerPhone) {
        newCustomer = await findOrCreateCustomer(
          {
            name: restData.customerName ?? sale.customerName,
            phone: restData.customerPhone.trim(),
            address: restData.customerAddress,
          },
          { session }
        );
        restData.customer = newCustomer._id;
        restData.customerPhone = newCustomer.phone;
        restData.customerName = newCustomer.name;
        restData.customerAddress = newCustomer.address;
      }

      // Credit opt-in gate for the (possibly new) target customer, mirroring
      // createSale. Only relevant if this update sets/keeps paymentMode as
      // Credit.
      const targetCustomerId = newCustomer ? newCustomer._id : sale.customer;
      const effectivePaymentMode = restData.paymentMode ?? sale.paymentMode;
      if (effectivePaymentMode === "Credit") {
        await ensureCreditCustomer(targetCustomerId, { confirmEnableCredit, session });
      }

      Object.assign(sale, restData);
      const updatedSale = await sale.save({ session });

      const diff = updatedSale.grandTotal - oldGrandTotal;

      if (!newCustomer) {
        // Same customer — just adjust their totalSpend if the amount changed.
        // Existing sale-level aggregate logic, untouched.
        if (diff !== 0 && oldCustomerId) {
          await Customer.updateOne(
            { _id: oldCustomerId },
            { $inc: { totalSpend: diff } },
            { session }
          );
        }
      } else {
        // Sale was reassigned to a different customer — back the old one
        // out, apply the full new amount to the new one.
        if (oldCustomerId) {
          await Customer.updateOne(
            { _id: oldCustomerId },
            { $inc: { totalOrders: -1, totalSpend: -oldGrandTotal } },
            { session }
          );
        }
        newCustomer.totalOrders += 1;
        newCustomer.totalSpend += updatedSale.grandTotal;
        await newCustomer.save({ session });
      }

      // Credit ledger sync. Handles every case from spec section 21/22 in
      // one place:
      //   - amount edited while staying Credit -> existing SALE txn amount
      //     updated in place (no stacked duplicate).
      //   - payment mode changed away from Credit -> existing SALE txn
      //     reversed.
      //   - payment mode changed TO Credit -> new SALE txn created.
      //   - customer reassigned while Credit -> syncSaleWithLedger reads
      //     sale.customer fresh off the just-saved document, so the new
      //     SALE txn (if any) is correctly attributed to the new customer;
      //     the OLD customer's original SALE txn (now orphaned from this
      //     sale by the reassignment) is reversed here explicitly since
      //     syncSaleWithLedger only looks up by saleId, not by customer.
      if (newCustomer && oldCustomerId) {
        const staleTxn = await LedgerTransaction.findOne({
          saleId: updatedSale._id,
          customerId: oldCustomerId,
          type: "SALE",
        }).session(session);
        if (staleTxn) {
          await reverseTransaction(staleTxn, {
            reason: "Sale reassigned to a different customer",
            session,
          });
        }
      }
      await syncSaleWithLedger(updatedSale, { session });

      result = updatedSale;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const deleteSale = async (id) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const sale = await Sale.findById(id).session(session);
      if (!sale) {
        throw new ApiError(404, "Sale not found");
      }

      const grandTotal = sale.grandTotal;
      const customerId = sale.customer;

      // Reverse any live ledger impact BEFORE deleting the sale, since
      // syncSaleWithLedger/reverseTransaction need the sale/its linked
      // transaction to still be queryable. Auditable reversal (spec
      // section 23) rather than silently losing the linked transaction.
      const existingTxn = await LedgerTransaction.findOne({
        saleId: sale._id,
        type: "SALE",
      }).session(session);
      if (existingTxn) {
        await reverseTransaction(existingTxn, { reason: "Sale deleted", session });
      }

      await Sale.findByIdAndDelete(id).session(session);

      // Decouple customer aggregates — existing sale-level logic, untouched.
      if (customerId) {
        await Customer.updateOne(
          { _id: customerId },
          { $inc: { totalOrders: -1, totalSpend: -grandTotal } },
          { session }
        );
      }

      result = sale;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

/**
 * Patches only the payment-related fields on an existing sale.
 * Deliberately does not touch items, customer, or totals — those go through
 * updateSale. The Sale model's pre-validate hook handles amountPaid/balanceDue
 * recalculation.
 *
 * NOTE: this endpoint currently has no way to receive confirmEnableCredit,
 * so switching paymentMode to "Credit" via patchPayment for a non-credit
 * customer will throw CreditOptInRequiredError and the patch will fail.
 * If patching payment mode to Credit needs to be supported from wherever
 * this endpoint is used in the UI, route that flow through updateSale
 * instead (which does accept confirmEnableCredit), or extend this
 * function's destructured params to accept it too.
 */
export const patchPayment = async (id, { paymentStatus, paymentMode, amountPaid }) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const sale = await Sale.findById(id)
        .populate("customer", "name phone address totalOrders totalSpend isCreditCustomer")
        .session(session);
      if (!sale) {
        throw new ApiError(404, "Sale not found");
      }

      sale.paymentStatus = paymentStatus;

      if (paymentStatus === "Unpaid") {
        // paymentMode is preserved by the Sale model's pre-validate hook
        // when it's "Credit" — see Sale.js. For any other mode it's wiped
        // as before.
        if (paymentMode) sale.paymentMode = paymentMode;
        sale.amountPaid = 0;
      } else {
        if (paymentMode) sale.paymentMode = paymentMode;
        if (paymentStatus === "Paid") {
          sale.amountPaid = sale.grandTotal;
        } else if (paymentStatus === "Partial" && amountPaid !== undefined) {
          sale.amountPaid = amountPaid;
        }
      }

      if (sale.paymentMode === "Credit") {
        // No confirmEnableCredit plumbing on this endpoint today — see note
        // above. This will throw CreditOptInRequiredError for non-credit
        // customers, same as create/updateSale.
        await ensureCreditCustomer(sale.customer._id, { session });
      }

      const updatedSale = await sale.save({ session });
      await syncSaleWithLedger(updatedSale, { session });

      result = updatedSale;
    });
    return result;
  } finally {
    await session.endSession();
  }
};