// src/scripts/seed-owner.js
import dotenv from "dotenv"
import mongoose from "mongoose"
import connectDB from "../config/db.js"
import { User } from "../models/User.js"
import logger from "../utils/logger.js"

dotenv.config({ path: "./.env" })

async function seedOwner() {
  await connectDB()

  const existingOwner = await User.findOne({ role: "owner" })
  if (existingOwner) {
    logger.info("Owner already exists, skipping seed.")
    await mongoose.disconnect()
    process.exit(0)
  }

  const owner = new User({
    name: "Restro Rasoi Owner",
    username: process.env.SEED_OWNER_USERNAME,
    passwordHash: process.env.SEED_OWNER_PASSWORD, // plain text in — pre-save hook hashes it
    role: "owner",
  })

  await owner.save()

  logger.info(`Owner account created: ${owner.username}`)
  await mongoose.disconnect()
  process.exit(0)
}

seedOwner().catch((err) => {
  logger.error("Seed failed:", err)
  process.exit(1)
})