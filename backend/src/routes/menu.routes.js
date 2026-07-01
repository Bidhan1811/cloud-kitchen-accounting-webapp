import { Router } from "express";
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "../controllers/menu.controller.js";
import { verifyJWT, requireRole } from "../middleware/auth.js";

const router = Router();

// Publicly available to authenticated users (Owner and Admin) for fetching the menu in the Sales form
router.route("/").get(verifyJWT, getMenuItems);

// Admin only routes for managing the menu master
router.route("/").post(verifyJWT, requireRole("admin"), createMenuItem);
router.route("/:id")
  .put(verifyJWT, requireRole("admin"), updateMenuItem)
  .delete(verifyJWT, requireRole("admin"), deleteMenuItem);

export default router;
