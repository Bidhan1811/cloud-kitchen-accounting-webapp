import mongoose, { Schema } from "mongoose";

const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Credit ledger opt-in. Defaults to false for both new and existing
    // customers (Mongoose applies schema defaults on read for documents
    // that predate this field, so no migration is required). Only
    // customers with this set to true can have LedgerTransaction records
    // created against them — see ledger.service.js.
    isCreditCustomer: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for searching
customerSchema.index({ phone: 1 });
customerSchema.index({ name: "text" });

export const Customer = mongoose.model("Customer", customerSchema);