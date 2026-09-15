import { Router } from "express";
import {
  getHomeExpenditures,
  getHomeExpenditureById,
  createHomeExpenditure,
  updateHomeExpenditure,
  deleteHomeExpenditure,
} from "../controllers/homeExpenditure.controller.js";
import { verifyJWT, requireRole } from "../middleware/auth.js";

const router = Router();

// Read routes — available to both Owner and Admin
router.route("/")
  .get(verifyJWT, getHomeExpenditures)
  .post(verifyJWT, createHomeExpenditure);

router.route("/:id")
  .get(verifyJWT, getHomeExpenditureById);

// Write routes — restricted to Admin for editing/deleting
router.route("/:id")
  .put(verifyJWT, requireRole("admin"), updateHomeExpenditure)
  .delete(verifyJWT, requireRole("admin"), deleteHomeExpenditure);

export default router;
