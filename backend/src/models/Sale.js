import mongoose, { Schema } from "mongoose";

const saleItemSchema = new Schema({
  itemName: {
    type: String,
    required: [true, "Item name is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Unit price cannot be negative"],
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
});

const saleSchema = new Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      required: [true, "Date is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },
    items: {
      type: [saleItemSchema],
      validate: [
        (val) => val.length > 0,
        "A Sale must have at least one item",
      ],
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, "Delivery charge cannot be negative"],
    },
    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid"],
      required: [true, "Payment status is required"],
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer", "Other"],
      required: function () {
        return this.paymentStatus === "Paid";
      },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Mongoose middleware to auto-calculate totals before saving
saleSchema.pre("validate", function (next) {
  if (this.items && this.items.length > 0) {
    let calculatedItemsTotal = 0;
    this.items.forEach((item) => {
      // Recompute lineTotal for integrity
      item.lineTotal = item.quantity * item.unitPrice;
      calculatedItemsTotal += item.lineTotal;
    });
    this.itemsTotal = calculatedItemsTotal;
    this.grandTotal = this.itemsTotal + (this.deliveryCharge || 0);
  }
  
  // If payment status is unpaid, we optionally clear/ignore paymentMode
  if (this.paymentStatus === "Unpaid") {
    this.paymentMode = undefined;
  }
  
  next();
});

// Indexes for common queries (Dashboard / Filtering)
saleSchema.index({ date: -1 });
saleSchema.index({ customerPhone: 1 });
saleSchema.index({ paymentStatus: 1 });

export const Sale = mongoose.model("Sale", saleSchema);
