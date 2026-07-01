import mongoose, { Schema } from "mongoose";

const menuItemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Dish name is required"],
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      trim: true,
      default: "Uncategorized",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
