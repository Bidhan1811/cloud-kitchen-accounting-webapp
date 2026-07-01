import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "./auth.routes.js";
import menuRouter from "./menu.routes.js";
import saleRouter from "./sale.routes.js";
import expenditureRouter from "./expenditure.routes.js";
import customerRouter from "./customer.routes.js";
import dashboardRouter from "./dashboard.routes.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/menu", menuRouter);
router.use("/sales", saleRouter);
router.use("/expenditure", expenditureRouter);
router.use("/customers", customerRouter);
router.use("/dashboard", dashboardRouter);

export default router;
