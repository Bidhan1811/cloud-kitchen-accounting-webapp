import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import { app } from "./src/app.js";
import logger from "./src/utils/logger.js";

dotenv.config({
  path: "./.env"
});

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info(`Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("MONGO DB connection failed !!! ", err);
  });
