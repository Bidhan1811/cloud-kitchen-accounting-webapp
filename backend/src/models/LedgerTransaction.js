import mongoose, { Schema } from "mongoose";

/**
 * LEDGER_TRANSACTION_TYPES
 * -------------------------------------------------------------------------
 * OPENING_BALANCE — one-time starting balance when a customer is first
 *                   marked as a credit customer. Always a debit (increases
 *                   what the customer owes), can be positive only.
 * SALE            — created automatically when a Sale is saved with
 *                   paymentMode="Credit". Amount is the DEFERRED portion of
 *                   that sale (balanceDue when Partial, grandTotal when
 *                   Unpaid) — never the sale's full grandTotal blindly.
 *                   Always a debit.
 * PAYMENT         — customer pays money against their outstanding balance.
 *                   Always a credit. Can exceed the current balance,
 *                   producing an advance (negative balance).
 * ADJUSTMENT      — manual correction by the owner. Direction is explicit
 *                   via `adjustmentType` ("DEBIT" increases balance,
 *                   "CREDIT" decreases it) rather than inferred from sign,
 *                   so intent is always unambiguous in the stored data.
 * REVERSAL        — created when a SALE or PAYMENT transaction needs to be
 *                   undone (sale deleted, payment mode changed away from
 *                   Credit, payment deleted) while preserving an auditable
 *                   trail instead of hard-deleting the original entry.
 *                   Direction is the exact opposite of whatever it reverses.
 */
export const LEDGER_TRANSACTION_TYPES = Object.freeze({
  OPENING_BALANCE: "OPENING_BALANCE",
  SALE: "SALE",
  PAYMENT: "PAYMENT",
  ADJUSTMENT: "ADJUSTMENT",
  REVERSAL: "REVERSAL",
});

export const LEDGER_ADJUSTMENT_TYPES = Object.freeze({
  DEBIT: "DEBIT",
  CREDIT: "CREDIT",
});

export const LEDGER_PAYMENT_MODES = Object.freeze({
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  OTHER: "Other",
});

/**
 * Every transaction stores an explicit, precomputed `balanceImpact` — the
 * signed amount this single transaction contributes to the running balance
 * (positive = increases what the customer owes, negative = decreases it).
 * `amount` is always a positive display value; `balanceImpact` is the
 * signed value actually summed for balance calculations. Storing
 * balanceImpact (rather than recomputing sign from `type` every time)
 * keeps calculateCustomerBalance a simple, fast sum and makes REVERSAL
 * trivial (just negate the original's balanceImpact) without needing to
 * re-derive direction from that original transaction's type.
 */
const ledgerTransactionSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(LEDGER_TRANSACTION_TYPES),
      required: [true, "Transaction type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    balanceImpact: {
      type: Number,
      required: true,
    },
    adjustmentType: {
      type: String,
      enum: Object.values(LEDGER_ADJUSTMENT_TYPES),
      required: function () {
        return this.type === LEDGER_TRANSACTION_TYPES.ADJUSTMENT;
      },
    },
    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      default: null,
      index: true,
    },
    reversalOfTransactionId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    paymentMode: {
      type: String,
      enum: Object.values(LEDGER_PAYMENT_MODES),
      required: function () {
        return this.type === LEDGER_TRANSACTION_TYPES.PAYMENT;
      },
    },
    reference: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    transactionDate: {
      type: Date,
      required: [true, "Transaction date is required"],
      default: Date.now,
    },
  },
  { timestamps: true }
);

ledgerTransactionSchema.index({ customerId: 1, transactionDate: 1, createdAt: 1 });
ledgerTransactionSchema.index({ saleId: 1 });

export const LedgerTransaction = mongoose.model("LedgerTransaction", ledgerTransactionSchema);