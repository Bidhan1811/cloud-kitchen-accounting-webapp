import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();

app.use(helmet());


// app.use(cors({
//   origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN?.split(",") || "*",
//   credentials: true
// }));
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes Import
import routes from "./routes/index.js";

// Routes Declaration
app.use("/api/v1", routes);

// Error Handling Middleware
import { errorHandler } from "./middleware/errorHandler.js";
app.use(errorHandler);

export { app };
