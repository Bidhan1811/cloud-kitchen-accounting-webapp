import { Router } from "express";
import { getSummary, getMonthly, getTrend, getChart, getTopItems, getRecentSales } from "../controllers/dashboard.controller.js";
import { verifyJWT, requireRole } from "../middleware/auth.js";

const router = Router();

// Dashboard is restricted to Admin only as per Project Flow PDF (Section 15.1)
router.use(verifyJWT, requireRole("admin"));

router.get("/summary", getSummary);
router.get("/monthly", getMonthly);
router.get("/trend", getTrend);
router.get("/chart", getChart);
router.get("/top-items", getTopItems);
router.get("/recent-sales", getRecentSales);


export default router;
