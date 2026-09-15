import mongoose, { Schema } from "mongoose";

const homeExpenditureSchema = new Schema(
  {
    homeExpenseId: {
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

// Auto-generate homeExpenseId before saving
homeExpenditureSchema.pre("save", function (next) {
  if (!this.homeExpenseId) {
    this.homeExpenseId = `HEXP-${Date.now().toString().slice(-6)}`;
  }
  next();
});

// Index on date for efficient querying
homeExpenditureSchema.index({ date: -1 });

export const HomeExpenditure = mongoose.model("HomeExpenditure", homeExpenditureSchema);
