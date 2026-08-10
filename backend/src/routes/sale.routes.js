import { Router } from "express";
import { getSales, getSaleById, createSale, updateSale, deleteSale, patchPayment } from "../controllers/sale.controller.js";
import { verifyJWT, requireRole } from "../middleware/auth.js";

const router = Router();

// Routes available to both Owner and Admin
router.route("/")
  .get(verifyJWT, getSales)
  .post(verifyJWT, createSale);

router.route("/:id")
  .get(verifyJWT, getSaleById);

// Quick payment status/mode update — no role restriction (both Owner & Admin can mark payment)
router.route("/:id/payment")
  .patch(verifyJWT, patchPayment);

// Routes restricted to Admin for editing/deleting past sales
router.route("/:id")
  .put(verifyJWT, requireRole("admin"), updateSale)
  .delete(verifyJWT, requireRole("admin"), deleteSale);

export default router;
