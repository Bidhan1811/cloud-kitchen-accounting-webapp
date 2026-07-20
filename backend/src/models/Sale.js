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
    // Hard link to the Customer document. Always set — even for a brand-new
    // customer, the service upserts the Customer first and stores its _id
    // here before the Sale is created.
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
    },
    // Denormalized snapshot of the customer's details at the time of sale.
    // Kept alongside the ref (not instead of it) so historical invoices keep
    // displaying the name/phone/address as they were at checkout, even if
    // the customer's profile is edited later.
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
    customerAddress: {
      type: String,
      trim: true,
      default: "",
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
      enum: ["Paid", "Unpaid", "Partial"],
      required: [true, "Payment status is required"],
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Credit"],
      required: function () {
        return this.paymentStatus === "Paid" || this.paymentStatus === "Partial";
      },
    },
    // Only meaningful when paymentStatus is "Partial". Represents how much of
    // the grandTotal has actually been collected so far.
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
    },
    // Derived convenience field: grandTotal - amountPaid. Kept in sync in the
    // pre-validate hook below so callers don't have to compute it themselves.
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
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

  // Keep amountPaid/balanceDue consistent with paymentStatus
  if (this.paymentStatus === "Paid") {
    this.amountPaid = this.grandTotal;
    this.balanceDue = 0;
  } else if (this.paymentStatus === "Unpaid") {
    this.amountPaid = 0;
    this.paymentMode = undefined;
    this.balanceDue = this.grandTotal;
  } else if (this.paymentStatus === "Partial") {
    // amountPaid must be provided by the caller and less than grandTotal;
    // clamp defensively so balanceDue never goes negative.
    this.amountPaid = Math.min(this.amountPaid || 0, this.grandTotal);
    this.balanceDue = this.grandTotal - this.amountPaid;
  }

  next();
});

// Indexes for common queries (Dashboard / Filtering)
saleSchema.index({ date: -1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ customerPhone: 1 });
saleSchema.index({ paymentStatus: 1 });

export const Sale = mongoose.model("Sale", saleSchema);