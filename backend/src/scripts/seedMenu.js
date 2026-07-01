import mongoose from "mongoose";
import dotenv from "dotenv";
import { MenuItem } from "../models/MenuItem.js";
import { DB_NAME } from "../constants/index.js";

dotenv.config({ path: "../../.env" });

const initialMenuItems = [
  { name: "Chicken Biryani (Full)", category: "Main Course", price: 250 },
  { name: "Chicken Biryani (Half)", category: "Main Course", price: 150 },
  { name: "Paneer Butter Masala", category: "Main Course", price: 200 },
  { name: "Butter Naan", category: "Breads", price: 40 },
  { name: "Tandoori Roti", category: "Breads", price: 20 },
  { name: "Cold Coffee", category: "Beverages", price: 80 },
];

const seedMenu = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
    await mongoose.connect(`${mongoUri}/${DB_NAME}`);
    console.log("Connected to MongoDB...");

    // Optional: Clear existing items before seeding
    // await MenuItem.deleteMany({});
    
    for (const item of initialMenuItems) {
      const existingItem = await MenuItem.findOne({ name: item.name });
      if (!existingItem) {
        await MenuItem.create(item);
        console.log(`Added: ${item.name}`);
      } else {
        console.log(`Skipped (already exists): ${item.name}`);
      }
    }

    console.log("Menu seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding menu:", error);
    process.exit(1);
  }
};

seedMenu();
