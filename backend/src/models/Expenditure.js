import mongoose, { Schema } from "mongoose";

const expenditureSchema = new Schema(
  {
    expenseId: {
      type: String,
      unique: true,
    },
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
    paymentMode: {
      type: String,
      required: [true, "Payment mode is required"],
      enum: ["cash", "card", "upi", "bank"],
    },
  },
  { timestamps: true }
);

// Auto-generate expenseId before saving
expenditureSchema.pre("save", function (next) {
  if (!this.expenseId) {
    // Generate an ID like EXP-XXXXXX based on timestamp
    this.expenseId = `EXP-${Date.now().toString().slice(-6)}`;
  }
  next();
});

// Index on date for efficient dashboard querying
expenditureSchema.index({ date: -1 });

export const Expenditure = mongoose.model("Expenditure", expenditureSchema);
