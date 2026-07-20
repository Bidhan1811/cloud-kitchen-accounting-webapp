import mongoose from "mongoose";
import { DB_NAME } from "../constants/index.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      process.env.MONGO_URI
    );
    logger.info(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    logger.error("MongoDB connection FAILED", error);
    process.exit(1);
  }
};

export default connectDB;
