import mongoose, { Schema } from "mongoose";

/**
 * Atomic per-year invoice sequence counter.
 *
 * One document exists per calendar year, keyed by `_id = "invoice_YYYY"`.
 * The `sequence` field is the last sequence number issued for that year.
 *
 * Documents are never deleted — gaps are acceptable, duplicate numbers are not.
 * The ONLY write path is through generateInvoiceNumber() in
 * invoiceNumber.service.js, which uses findOneAndUpdate + $inc (atomic) so
 * concurrent requests can never collide.
 */
const invoiceCounterSchema = new Schema({
  _id: {
    // e.g. "invoice_2026"
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
    default: 0,
  },
});

export const InvoiceCounter = mongoose.model("InvoiceCounter", invoiceCounterSchema);
