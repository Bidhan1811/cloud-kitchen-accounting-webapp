import { Router } from "express";
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from "../controllers/customer.controller.js";
import { verifyJWT, requireRole } from "../middleware/auth.js";

const router = Router();

// Routes available to both Owner and Admin
router.route("/")
  .get(verifyJWT, getCustomers)
  .post(verifyJWT, createCustomer);

router.route("/:id")
  .get(verifyJWT, getCustomerById);

// Routes restricted to Admin for editing/deleting customers
router.route("/:id")
  .put(verifyJWT, requireRole("admin"), updateCustomer)
  .delete(verifyJWT, requireRole("admin"), deleteCustomer);

export default router;
