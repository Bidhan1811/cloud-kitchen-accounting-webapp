import { Router } from "express";
import { loginUser, logoutUser, getCurrentUser } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    message: "Too many login attempts from this IP, please try again after 15 minutes",
  }
});

const router = Router();

router.route("/login").post(loginLimiter, loginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;
