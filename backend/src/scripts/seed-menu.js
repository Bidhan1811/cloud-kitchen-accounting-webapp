import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { MenuItem } from "../models/MenuItem.js";
import menuData from "./restro_rasoi_menu_seed.json" assert { type: "json" };

// const MONGO_URI = process.env.MONGO_URI;

async function seedMenu() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Upsert each item by name so re-running this script is safe (no duplicates)
    let created = 0;
    let updated = 0;

    for (const item of menuData) {
      const result = await MenuItem.findOneAndUpdate(
        { name: item.name },
        { $set: item },
        { upsert: true, new: true, rawResult: true }
      );

      if (result.lastErrorObject?.updatedExisting) {
        updated++;
      } else {
        created++;
      }
    }

    console.log(`Seeding complete. Created: ${created}, Updated: ${updated}, Total: ${menuData.length}`);
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedMenu();