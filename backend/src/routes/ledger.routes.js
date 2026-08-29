import { Router } from "express";
import {
  getLedger,
  getLedgerSummary,
  createPayment,
  deletePayment,
  createAdjustment,
} from "../controllers/ledger.controller.js";
import { verifyJWT, requireRole } from "../middleware/auth.js";

const router = Router();

// Full ledger + monthly summary — available to both Owner and Admin, same
// as viewing a customer's profile/order history today.
router.route("/:customerId/ledger").get(verifyJWT, getLedger);
router.route("/:customerId/ledger/summary").get(verifyJWT, getLedgerSummary);

// Recording payments — both Owner and Admin, same as recording a sale or
// patching a sale's payment status.
router.route("/:customerId/ledger/payment").post(verifyJWT, createPayment);

// Deleting a payment reverses real money already recorded as received —
// restricted to Admin, same restriction level as editing/deleting past sales.
router.route("/ledger/payment/:transactionId").delete(verifyJWT, requireRole("admin"), deletePayment);

// Adjustments directly change a customer's balance outside the normal
// sale/payment flow — restricted to Admin, same as sale edits/deletes.
router.route("/:customerId/ledger/adjustment").post(verifyJWT, requireRole("admin"), createAdjustment);

export default router;