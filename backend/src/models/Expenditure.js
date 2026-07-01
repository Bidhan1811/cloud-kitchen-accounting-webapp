import mongoose, { Schema } from "mongoose";

const expenditureSchema = new Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      required: [true, "Date is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    items: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index on date for efficient dashboard querying
expenditureSchema.index({ date: -1 });

export const Expenditure = mongoose.model("Expenditure", expenditureSchema);
