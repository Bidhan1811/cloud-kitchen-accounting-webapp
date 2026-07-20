/**
 * seedCustomers.js
 *
 * Seeds the Customer collection from customers.data.json.
 * Uses upsert (matched on `phone`) so it's safe to re-run without
 * creating duplicates.
 *
 * Usage:
 *   node seedCustomers.js
 *
 * Make sure MONGODB_URI is set in your .env (or hardcode it below).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Customer } from "../models/Customer.js"; // adjust path to your actual model file

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/restrorasoi";

async function seedCustomers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const dataPath = path.join(__dirname, "customer_data.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const customers = JSON.parse(rawData);

    console.log(`📦 Loaded ${customers.length} customer records from JSON`);

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        const result = await Customer.findOneAndUpdate(
          { phone: customer.phone },
          {
            $set: {
              name: customer.name,
              address: customer.address,
            },
            $setOnInsert: {
              totalOrders: 0,
              totalSpend: 0,
            },
          },
          {
            upsert: true,
            new: true,
            rawResult: true,
          }
        );

        if (result.lastErrorObject?.updatedExisting) {
          updated++;
        } else {
          created++;
        }
      } catch (err) {
        failed++;
        console.error(`❌ Failed to seed "${customer.name}" (${customer.phone}):`, err.message);
      }
    }

    console.log("\n--- Seeding Summary ---");
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`❌ Failed:  ${failed}`);
    console.log(`📊 Total in file: ${customers.length}`);

    const totalInDb = await Customer.countDocuments();
    console.log(`📁 Total customers now in DB: ${totalInDb}`);
  } catch (err) {
    console.error("Fatal error while seeding customers:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

seedCustomers();