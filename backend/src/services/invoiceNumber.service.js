import { InvoiceCounter } from "../models/InvoiceCounter.js";

/**
 * Atomically reserves and returns the next invoice number for the given date's
 * calendar year, formatted as `RR/YYMM/XXXXXX`.
 *
 * Design notes:
 *
 *   - Uses MongoDB's findOneAndUpdate with $inc + upsert so concurrent
 *     createSale() calls on the same server (or across multiple instances)
 *     can never receive the same sequence number. MongoDB guarantees
 *     atomicity for single-document updates.
 *
 *   - The counter is incremented BEFORE the sale is created and OUTSIDE
 *     any Mongoose session/transaction. This is deliberate: if the sale
 *     creation later fails, the sequence number is simply skipped (a gap).
 *     Gaps are acceptable; duplicate invoice numbers are not. Decrementing
 *     on failure would risk reuse if the decrement itself failed.
 *
 *   - The year is derived from the sale's `date` field (not server time) so
 *     that backdated sales get the correct year in their invoice number.
 *
 * @param {Date|string} [saleDate] - The sale's date. Defaults to today.
 * @returns {Promise<string>} e.g. "RR/2026/000001"
 */
export const generateInvoiceNumber = async (saleDate) => {
  const date = saleDate ? new Date(saleDate) : new Date();
  const year = date.getFullYear();
  const counterId = `invoice_${year}`;

  const counter = await InvoiceCounter.findOneAndUpdate(
    { _id: counterId },
    {
      $inc: { sequence: 1 },
      // Only set year on first insert (upsert). $setOnInsert is ignored on
      // subsequent updates so it doesn't overwrite anything.
      $setOnInsert: { year },
    },
    {
      upsert: true,
      returnDocument: "after", // return the document AFTER the increment
      new: true,
    }
  );

  const shortYear = String(year).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const yearMonth = `${shortYear}${month}`;

  const paddedSequence = String(counter.sequence).padStart(6, "0");
  return `RR/${yearMonth}/${paddedSequence}`;
};
