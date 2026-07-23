import { Router } from "express";
import { parseVoice } from "../controllers/voice.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { uploadAudio } from "../middleware/multer.js";

const router = Router();

// Available to both Owner and Admin — same access level as creating a
// sale/expense/menu-item/customer manually.
router.route("/parse").post(verifyJWT, uploadAudio.single("audio"), parseVoice);

export default router;