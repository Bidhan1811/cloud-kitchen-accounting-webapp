import mongoose from "mongoose";
import { Customer } from "../models/Customer.js";
import { Sale } from "../models/Sale.js";
import {
  LedgerTransaction,
  LEDGER_TRANSACTION_TYPES,
  LEDGER_ADJUSTMENT_TYPES,
} from "../models/LedgerTransaction.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Thrown when a Credit sale is submitted for a customer who isn't yet a
 * credit customer and the caller hasn't confirmed enabling it. Controllers
 * catch this by error code (not just message) so the frontend can render a
 * proper "enable credit tracking for this customer?" confirmation instead
 * of a generic error toast.
 */
export class CreditOptInRequiredError extends ApiError {
  constructor(customer) {
    super(
      409,
      `${customer.name} is not marked as a credit customer yet. Enable credit tracking to record this sale as Credit?`
    );
    this.code = "CREDIT_OPT_IN_REQUIRED";
    this.customerId = customer._id;
  }
}

/**
 * Computes the deferred (unpaid) portion of a sale that should hit the
 * ledger. This is deliberately NOT sale.grandTotal — a Credit sale can
 * still have a partial cash/UPI component collected at checkout, and only
 * the actual shortfall is what the customer owes going forward.
 *
 *   paymentStatus="Unpaid"  -> full grandTotal is deferred
 *   paymentStatus="Partial" -> balanceDue (grandTotal - amountPaid) is deferred
 *   paymentStatus="Paid"    -> nothing is deferred (0) — see note below
 *
 * A "Paid" Credit sale is a contradiction in practice (if the shop was paid
 * in full there's nothing to defer) but is handled defensively by
 * returning 0 rather than throwing, so it's a no-op on the ledger instead
 * of a hard failure.
 */
export const getDeferredAmountForSale = (sale) => {
  if (sale.paymentMode !== "Credit") return 0;
  if (sale.paymentStatus === "Unpaid") return sale.grandTotal;
  if (sale.paymentStatus === "Partial") return Math.max(sale.balanceDue, 0);
  return 0;
};

/**
 * Sums balanceImpact across all of a customer's ledger transactions.
 * This is THE authoritative balance calculation — the backend is the
 * single source of truth (spec section 36); nothing on the frontend
 * recomputes this independently.
 *
 * Positive  -> customer owes the business (display as "Outstanding")
 * Zero      -> settled
 * Negative  -> customer has paid in advance (display as "Advance Balance")
 */
export const calculateCustomerBalance = async (customerId, { session } = {}) => {
  const result = await LedgerTransaction.aggregate(
    [
      { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
      { $group: { _id: null, balance: { $sum: "$balanceImpact" } } },
    ],
    { session }
  );
  return result.length > 0 ? result[0].balance : 0;
};

/**
 * Walks a customer's outstanding (non-"Paid") Credit sales, oldest first,
 * and settles as many as possible from their CURRENT advance balance —
 * purely as a display fix on the Sale documents themselves. Never touches
 * any LedgerTransaction; the ledger's running balance is already correct
 * by the time this runs (that's precisely why advance exists to draw from).
 *
 * This is the single shared implementation used by:
 *   - createSale (immediately after a new Credit sale is synced to the
 *     ledger, in case the customer already had advance)
 *   - createPayment (immediately after a payment pushes the balance into
 *     advance territory, in case older Partial/Unpaid Credit sales are now
 *     coverable)
 *   - the one-time backfillAdvanceSettledSales.js migration script
 *
 * Before this existed, each of those call sites either duplicated this
 * logic or (in createPayment's case) simply didn't run it at all — which
 * is exactly the bug where a Partial sale's remaining balanceDue stayed
 * stuck even after a later payment pushed the customer into advance.
 *
 * Returns the number of Sale documents updated.
 */
export const settleSalesFromAdvance = async (customerId, { session } = {}) => {
  const balance = await calculateCustomerBalance(customerId, { session });
  let advancePool = balance < 0 ? Math.abs(balance) : 0;
  if (advancePool <= 0) return 0;

  const candidateSales = await Sale.find(
    {
      customer: customerId,
      paymentMode: "Credit",
      paymentStatus: { $in: ["Unpaid", "Partial"] },
    },
    null,
    { session }
  ).sort({ date: 1, createdAt: 1 });

  let updatedCount = 0;

  for (const sale of candidateSales) {
    if (advancePool <= 0) break;

    const currentlyOwed = sale.balanceDue;
    if (currentlyOwed <= 0) continue;

    if (advancePool >= currentlyOwed) {
      advancePool -= currentlyOwed;
      sale.paymentStatus = "Paid";
      sale.amountPaid = sale.grandTotal;
      await sale.save({ session });
      updatedCount += 1;
    } else {
      sale.paymentStatus = "Partial";
      sale.amountPaid = (sale.amountPaid || 0) + advancePool;
      await sale.save({ session });
      updatedCount += 1;
      advancePool = 0;
    }
  }

  return updatedCount;
};

/**
 * Formats a raw balance number into the {amount, label, isAdvance} shape
 * the UI needs, per spec section 2 — never show a negative number labeled
 * "Outstanding".
 */
export const describeBalance = (balance) => {
  const rounded = Math.round(balance * 100) / 100;
  if (rounded > 0) {
    return { amount: rounded, label: "Outstanding", isAdvance: false, isSettled: false };
  }
  if (rounded < 0) {
    return { amount: Math.abs(rounded), label: "Advance Balance", isAdvance: true, isSettled: false };
  }
  return { amount: 0, label: "Settled", isAdvance: false, isSettled: true };
};

/**
 * Deterministically ordered ledger transactions for a customer, optionally
 * scoped to a date range. This is the shared query both the ledger view
 * and the running-balance builder use, so ordering never drifts between
 * the two.
 */
const getOrderedTransactions = async (customerId, { startDate, endDate, session } = {}) => {
  const query = { customerId };
  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) query.transactionDate.$gte = startDate;
    if (endDate) query.transactionDate.$lte = endDate;
  }
  return LedgerTransaction.find(query, null, { session }).sort({
    transactionDate: 1,
    createdAt: 1,
  });
};

/**
 * Builds a running-balance ledger view for a date range, given a known
 * opening balance (the caller — getMonthlyLedgerSummary — is responsible
 * for computing that from prior months; this function just applies it).
 *
 * saleItemsMap is a pre-built Map<saleId_string, items[]> built by the
 * caller in a single batch query — never fetched N+1 here.
 */
const buildRunningLedger = (transactions, openingBalance, saleItemsMap = new Map()) => {
  let running = openingBalance;
  const rows = transactions.map((txn) => {
    running += txn.balanceImpact;
    const row = {
      _id: txn._id,
      type: txn.type,
      adjustmentType: txn.adjustmentType,
      amount: txn.amount,
      balanceImpact: txn.balanceImpact,
      saleId: txn.saleId,
      paymentMode: txn.paymentMode,
      reference: txn.reference,
      description: txn.description,
      transactionDate: txn.transactionDate,
      createdAt: txn.createdAt,
      // Debit/credit split for table display (spec section 17/29) —
      // derived here once so the frontend never has to re-derive direction.
      debit: txn.balanceImpact > 0 ? txn.balanceImpact : 0,
      credit: txn.balanceImpact < 0 ? Math.abs(txn.balanceImpact) : 0,
      runningBalance: Math.round(running * 100) / 100,
    };
    // Attach sale items so the excel export (and any future feature) can
    // display the actual order contents without a separate API round-trip.
    if (txn.type === "SALE" && txn.saleId) {
      const items = saleItemsMap.get(txn.saleId.toString());
      if (items) row.saleItems = items;
    }
    return row;
  });
  return { rows, closingBalance: Math.round(running * 100) / 100 };
};

/**
 * Builds a Map<saleId, items[]> for all SALE-type transactions in a batch.
 * Single query — never N+1.
 */
const buildSaleItemsMap = async (transactions) => {
  const saleIds = transactions
    .filter((t) => t.type === "SALE" && t.saleId)
    .map((t) => t.saleId);
  if (saleIds.length === 0) return new Map();
  const sales = await Sale.find({ _id: { $in: saleIds } }).select("items").lean();
  return new Map(sales.map((s) => [s._id.toString(), s.items]));
};

/**
 * Returns the customer's balance as of just before `beforeDate` — i.e. the
 * sum of every transaction strictly earlier than that date. Used to derive
 * a given month's opening balance from everything that came before it,
 * which automatically implements "previous month's closing balance becomes
 * next month's opening balance" (spec section 15) and "month with no
 * activity carries the balance forward unchanged" (spec section 16) with
 * no special-casing needed — an empty month just sums zero transactions
 * and returns the same opening/closing balance.
 */
const getBalanceBefore = async (customerId, beforeDate, { session } = {}) => {
  const result = await LedgerTransaction.aggregate(
    [
      {
        $match: {
          customerId: new mongoose.Types.ObjectId(customerId),
          transactionDate: { $lt: beforeDate },
        },
      },
      { $group: { _id: null, balance: { $sum: "$balanceImpact" } } },
    ],
    { session }
  );
  return result.length > 0 ? result[0].balance : 0;
};

/**
 * Full ledger for a customer within an optional date range, with running
 * balances computed against the correct opening balance for that range.
 */
export const getCustomerLedger = async (customerId, { startDate, endDate } = {}) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, "Customer not found");

  const rangeStart = startDate ? new Date(startDate) : null;
  const openingBalance = rangeStart ? await getBalanceBefore(customerId, rangeStart) : 0;

  const transactions = await getOrderedTransactions(customerId, {
    startDate: rangeStart,
    endDate: endDate ? new Date(endDate) : null,
  });

  const saleItemsMap = await buildSaleItemsMap(transactions);
  const { rows, closingBalance } = buildRunningLedger(transactions, openingBalance, saleItemsMap);

  return {
    customer: { _id: customer._id, name: customer.name, phone: customer.phone },
    openingBalance: Math.round(openingBalance * 100) / 100,
    closingBalance,
    transactions: rows,
  };
};

/**
 * Monthly summary reconciling exactly with the underlying transactions
 * (spec section 31): opening balance, credit sales, payments received,
 * debit/credit adjustments, closing balance — all derived from the same
 * ledger rows so nothing can drift out of sync with the detail view.
 */
export const getMonthlyLedgerSummary = async (customerId, { year, month }) => {
  // month is 1-12 for a natural API surface; JS Date month is 0-11.
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999); // last day of month

  const openingBalance = await getBalanceBefore(customerId, monthStart);
  const transactions = await getOrderedTransactions(customerId, {
    startDate: monthStart,
    endDate: monthEnd,
  });

  const saleItemsMap = await buildSaleItemsMap(transactions);
  const { rows, closingBalance } = buildRunningLedger(transactions, openingBalance, saleItemsMap);

  const summary = {
    openingBalance: Math.round(openingBalance * 100) / 100,
    creditSales: 0,
    paymentsReceived: 0,
    debitAdjustments: 0,
    creditAdjustments: 0,
    closingBalance,
  };

  for (const txn of rows) {
    if (txn.type === LEDGER_TRANSACTION_TYPES.SALE) {
      summary.creditSales += txn.amount;
    } else if (txn.type === LEDGER_TRANSACTION_TYPES.PAYMENT) {
      summary.paymentsReceived += txn.amount;
    } else if (txn.type === LEDGER_TRANSACTION_TYPES.ADJUSTMENT) {
      if (txn.adjustmentType === LEDGER_ADJUSTMENT_TYPES.DEBIT) {
        summary.debitAdjustments += txn.amount;
      } else {
        summary.creditAdjustments += txn.amount;
      }
    }
    // REVERSAL and OPENING_BALANCE deliberately don't get their own summary
    // buckets — OPENING_BALANCE is represented by `openingBalance` itself
    // when it falls in this exact month, and REVERSAL amounts already
    // netted out of whichever bucket (creditSales/paymentsReceived) they
    // reversed by virtue of summing balanceImpact into closingBalance; only
    // the display buckets above are for the transaction-type breakdown.
  }

  summary.creditSales = round2(summary.creditSales);
  summary.paymentsReceived = round2(summary.paymentsReceived);
  summary.debitAdjustments = round2(summary.debitAdjustments);
  summary.creditAdjustments = round2(summary.creditAdjustments);

  return { year, month, ...summary, transactions: rows };
};

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Ensures a customer is opted into credit tracking before any ledger
 * transaction can be created for them. Throws CreditOptInRequiredError if
 * they aren't and the caller hasn't confirmed enabling it — see spec
 * Case 7. When confirmed, flips isCreditCustomer=true as part of the same
 * flow (caller is responsible for saving within the same session/transaction
 * as whatever triggered this, e.g. the sale creation).
 */
export const ensureCreditCustomer = async (customerId, { confirmEnableCredit = false, session } = {}) => {
  const customer = await Customer.findById(customerId).session(session ?? null);
  if (!customer) throw new ApiError(404, "Customer not found");

  if (!customer.isCreditCustomer) {
    if (!confirmEnableCredit) {
      throw new CreditOptInRequiredError(customer);
    }
    customer.isCreditCustomer = true;
    await customer.save({ session });
  }

  return customer;
};

/**
 * Creates an OPENING_BALANCE transaction for a customer. Spec section 14 —
 * must be a real ledger transaction, never customer.balance = X directly.
 * Should only be called once per customer (typically right when
 * isCreditCustomer flips to true) — callers are responsible for that
 * one-time gating; this function itself doesn't enforce uniqueness beyond
 * requiring a positive amount, since a customer could legitimately want to
 * skip an opening balance (amount 0 / not called at all).
 */
export const createOpeningBalance = async (customerId, { amount, transactionDate, session }) => {
  if (amount <= 0) return null;

  const [txn] = await LedgerTransaction.create(
    [
      {
        customerId,
        type: LEDGER_TRANSACTION_TYPES.OPENING_BALANCE,
        amount,
        balanceImpact: amount, // opening balance always increases what's owed
        description: "Opening Balance",
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      },
    ],
    { session }
  );
  return txn;
};

/**
 * Creates (or updates, or removes) the SALE ledger transaction tied to a
 * given sale, keeping it in sync with that sale's current paymentMode and
 * deferred amount. This is the single function sale.service.js calls after
 * every create/update/delete so ledger sync logic lives in exactly one
 * place (spec section 35 — "do not duplicate accounting calculations").
 *
 * Behavior:
 *   - If the sale is (now) Credit with deferredAmount > 0:
 *       - No existing SALE txn for this saleId -> create one.
 *       - Existing SALE txn with a DIFFERENT amount -> update its amount
 *         and balanceImpact in place (spec section 21 — editing a sale's
 *         amount must not create a second stacked entry).
 *       - Existing SALE txn with the SAME amount -> no-op.
 *   - If the sale is NOT (or no longer) Credit, or deferredAmount is 0:
 *       - Existing SALE txn for this saleId -> reverse it (spec section 22,
 *         "CREDIT -> UPI must remove the outstanding impact", done via an
 *         auditable REVERSAL rather than silently deleting history).
 *       - No existing SALE txn -> no-op.
 *
 * Deliberately does NOT throw CreditOptInRequiredError itself — the caller
 * (sale.service.js) is expected to call ensureCreditCustomer() BEFORE
 * calling this, while it still has a chance to surface that confirmation
 * flow to the user before the sale is committed.
 */
export const syncSaleWithLedger = async (sale, { session } = {}) => {
  const deferredAmount = getDeferredAmountForSale(sale);
  const existingTxn = await LedgerTransaction.findOne({
    saleId: sale._id,
    type: LEDGER_TRANSACTION_TYPES.SALE,
  }).session(session ?? null);

  const isCreditNow = sale.paymentMode === "Credit" && deferredAmount > 0;

  if (isCreditNow) {
    if (!existingTxn) {
      await LedgerTransaction.create(
        [
          {
            customerId: sale.customer,
            type: LEDGER_TRANSACTION_TYPES.SALE,
            amount: deferredAmount,
            balanceImpact: deferredAmount,
            saleId: sale._id,
            description: `Order #${sale.invoiceId}`,
            transactionDate: sale.date,
          },
        ],
        { session }
      );
      return;
    }

    if (existingTxn.amount !== deferredAmount) {
      existingTxn.amount = deferredAmount;
      existingTxn.balanceImpact = deferredAmount;
      existingTxn.transactionDate = sale.date;
      await existingTxn.save({ session });
    }
    return;
  }

  // Not (or no longer) a live credit deferral for this sale — reverse any
  // existing SALE transaction so it stops contributing to the balance.
  if (existingTxn) {
    await reverseTransaction(existingTxn, { reason: "Sale updated — no longer a credit deferral", session });
  }
};

/**
 * Creates an auditable REVERSAL transaction that exactly negates an
 * existing transaction's balanceImpact (spec sections 23/24 — prefer
 * reversal over silent deletion so there's no unexplained balance change).
 * The original transaction is left in place for history; only its effect
 * is undone via the new REVERSAL row.
 */
export const reverseTransaction = async (originalTxn, { reason, session } = {}) => {
  const [reversal] = await LedgerTransaction.create(
    [
      {
        customerId: originalTxn.customerId,
        type: LEDGER_TRANSACTION_TYPES.REVERSAL,
        amount: originalTxn.amount,
        balanceImpact: -originalTxn.balanceImpact,
        saleId: originalTxn.saleId ?? null,
        reversalOfTransactionId: originalTxn._id,
        description: reason || `Reversal of ${originalTxn.type}`,
        transactionDate: new Date(),
      },
    ],
    { session }
  );
  return reversal;
};

/**
 * Records a customer payment. Supports partial, lump-sum, and advance
 * payments uniformly — a payment is always just a single PAYMENT
 * transaction for the amount given; overpayment naturally produces a
 * negative running balance (advance) with no special-casing required
 * (spec sections 11-13).
 */
export const createPayment = async (
  customerId,
  { amount, paymentDate, paymentMode, reference, description },
  { session } = {}
) => {
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  const customer = await Customer.findById(customerId).session(session ?? null);
  if (!customer) throw new ApiError(404, "Customer not found");
  if (!customer.isCreditCustomer) {
    throw new ApiError(400, "This customer is not a credit customer");
  }

  // Duplicate-reference protection (spec section 26) — reference is not
  // mandatory for cash, but if one is provided and already used for this
  // customer, warn rather than silently double-recording it. Surfaced as a
  // distinct error code so the frontend can prompt "record anyway?" rather
  // than treating it as a hard failure.
  if (reference && reference.trim()) {
    const duplicate = await LedgerTransaction.findOne({
      customerId,
      type: LEDGER_TRANSACTION_TYPES.PAYMENT,
      reference: reference.trim(),
    }).session(session ?? null);
    if (duplicate) {
      const err = new ApiError(409, `A payment with reference "${reference.trim()}" was already recorded for this customer.`);
      err.code = "DUPLICATE_PAYMENT_REFERENCE";
      throw err;
    }
  }

  const balanceBefore = await calculateCustomerBalance(customerId, { session });

  const [txn] = await LedgerTransaction.create(
    [
      {
        customerId,
        type: LEDGER_TRANSACTION_TYPES.PAYMENT,
        amount,
        balanceImpact: -amount,
        paymentMode,
        reference: reference?.trim() || "",
        description: description?.trim() || "Payment received",
        transactionDate: paymentDate ? new Date(paymentDate) : new Date(),
      },
    ],
    { session }
  );

  const balanceAfter = balanceBefore - amount;

  // If this payment pushed the customer into (or further into) advance
  // territory, retroactively settle their outstanding Credit sales from
  // that advance — oldest first. This is what fixes the case where a sale
  // was left "Partial" because a prior advance ran out partway through it;
  // a later payment that replenishes the advance should go back and finish
  // settling that sale, not just sit in the ledger balance unapplied.
  await settleSalesFromAdvance(customerId, { session });

  return { transaction: txn, balanceBefore: round2(balanceBefore), balanceAfter: round2(balanceAfter) };
};

/**
 * Deletes a payment by reversing it (spec section 24 — the payment's
 * credit effect must be undone, restoring the balance it had reduced).
 */
export const deletePayment = async (transactionId, { session } = {}) => {
  const txn = await LedgerTransaction.findById(transactionId).session(session ?? null);
  if (!txn) throw new ApiError(404, "Payment not found");
  if (txn.type !== LEDGER_TRANSACTION_TYPES.PAYMENT) {
    throw new ApiError(400, "Only PAYMENT transactions can be deleted this way");
  }
  return reverseTransaction(txn, { reason: "Payment deleted", session });
};

/**
 * Records a manual debit/credit adjustment (spec section 19). Direction is
 * explicit via adjustmentType, never inferred, and a reason is mandatory.
 */
export const createAdjustment = async (
  customerId,
  { amount, adjustmentType, reason, transactionDate },
  { session } = {}
) => {
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Adjustment amount must be greater than 0");
  }
  if (!Object.values(LEDGER_ADJUSTMENT_TYPES).includes(adjustmentType)) {
    throw new ApiError(400, "adjustmentType must be DEBIT or CREDIT");
  }
  if (!reason || !reason.trim()) {
    throw new ApiError(400, "An adjustment reason/description is required");
  }

  const customer = await Customer.findById(customerId).session(session ?? null);
  if (!customer) throw new ApiError(404, "Customer not found");
  if (!customer.isCreditCustomer) {
    throw new ApiError(400, "This customer is not a credit customer");
  }

  const balanceImpact = adjustmentType === LEDGER_ADJUSTMENT_TYPES.DEBIT ? amount : -amount;

  const [txn] = await LedgerTransaction.create(
    [
      {
        customerId,
        type: LEDGER_TRANSACTION_TYPES.ADJUSTMENT,
        amount,
        balanceImpact,
        adjustmentType,
        description: reason.trim(),
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      },
    ],
    { session }
  );

  return txn;
};