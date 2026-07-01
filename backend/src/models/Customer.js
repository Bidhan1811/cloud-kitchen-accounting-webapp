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
  },
  { timestamps: true }
);

// Indexes for searching
customerSchema.index({ phone: 1 });
customerSchema.index({ name: "text" });

export const Customer = mongoose.model("Customer", customerSchema);
