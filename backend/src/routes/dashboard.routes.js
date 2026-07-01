import { Router } from "express";
import { getSummary, getMonthly, getTrend } from "../controllers/dashboard.controller.js";
import { verifyJWT, requireRole } from "../middleware/auth.js";

const router = Router();

// Dashboard is restricted to Admin only as per Project Flow PDF (Section 15.1)
router.use(verifyJWT, requireRole("admin"));

router.get("/summary", getSummary);
router.get("/monthly", getMonthly);
router.get("/trend", getTrend);

export default router;
