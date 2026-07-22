import mongoose from "mongoose";
import dotenv from "dotenv";
import { Customer } from "./src/models/Customer.js";
import { MenuItem } from "./src/models/MenuItem.js";
import { Sale } from "./src/models/Sale.js";
import { Expenditure } from "./src/models/Expenditure.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log("Connecting to:", MONGO_URI);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB!");
  
  const customerCount = await Customer.countDocuments();
  const menuItemCount = await MenuItem.countDocuments();
  const saleCount = await Sale.countDocuments();
  const expenditureCount = await Expenditure.countDocuments();
  
  console.log("Customer count:", customerCount);
  console.log("MenuItem count:", menuItemCount);
  console.log("Sale count:", saleCount);
  console.log("Expenditure count:", expenditureCount);
  
  await mongoose.disconnect();
}

run().catch(console.error);
