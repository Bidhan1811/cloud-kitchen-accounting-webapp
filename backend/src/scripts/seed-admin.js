// seed/seedAdmin.js
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User.js"; // adjust path to your model

const MONGO_URI = process.env.MONGO_URI;

const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Restro Rasoi Admin";
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD; // no fallback — force explicit
const ADMIN_ROLE = "admin"; // or "owner" depending on which account you need

async function seedAdmin() {
  if (!MONGO_URI) {
    console.error("Missing MONGO_URI in environment. Aborting.");
    process.exit(1);
  }

  if (!ADMIN_PASSWORD) {
    console.error(
      "Missing SEED_ADMIN_PASSWORD in environment. Set it before running the seed script."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Seed script connected to DB:", mongoose.connection.name);
    console.log("Seed script connected to host:", mongoose.connection.host);

    const existing = await User.findOne({ username: ADMIN_USERNAME.toLowerCase() });
    if (existing) {
      console.log(`User "${ADMIN_USERNAME}" already exists (role: ${existing.role}). Skipping.`);
      await mongoose.disconnect();
      return;
    }

    // Pass the plain password as passwordHash — your pre("save") hook hashes it
    const admin = new User({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      passwordHash: ADMIN_PASSWORD,
      role: ADMIN_ROLE,
    });

    await admin.save();

    console.log("Admin account created successfully:");
    console.log(`  name:     ${admin.name}`);
    console.log(`  username: ${admin.username}`);
    console.log(`  role:     ${admin.role}`);
    console.log(`  id:       ${admin._id}`);
  } catch (err) {
    console.error("Error seeding admin account:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedAdmin();