import { Router } from "express";
import { loginUser, logoutUser, getCurrentUser } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();

router.route("/login").post(loginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;
