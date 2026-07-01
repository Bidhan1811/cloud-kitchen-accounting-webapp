import { Router } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json(new ApiResponse(200, null, "Server is healthy and running"));
});

export default router;
