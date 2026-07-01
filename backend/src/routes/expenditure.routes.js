import { Router } from "express";
import { getExpenditures, getExpenditureById, createExpenditure, updateExpenditure, deleteExpenditure } from "../controllers/expenditure.controller.js";
import { verifyJWT, requireRole } from "../middleware/auth.js";

const router = Router();

// Routes available to both Owner and Admin
router.route("/")
  .get(verifyJWT, getExpenditures)
  .post(verifyJWT, createExpenditure);

router.route("/:id")
  .get(verifyJWT, getExpenditureById);

// Routes restricted to Admin for editing/deleting past expenditures
router.route("/:id")
  .put(verifyJWT, requireRole("admin"), updateExpenditure)
  .delete(verifyJWT, requireRole("admin"), deleteExpenditure);

export default router;
