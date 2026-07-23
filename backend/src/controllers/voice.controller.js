import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { parseVoiceEntry } from "../services/voice.service.js";

const VALID_CONTEXTS = ["sale", "expense", "menu", "customer"];

export const parseVoice = asyncHandler(async (req, res) => {
  const { context } = req.body;

  if (!VALID_CONTEXTS.includes(context)) {
    throw new ApiError(400, `context must be one of: ${VALID_CONTEXTS.join(", ")}`);
  }

  if (!req.file) {
    throw new ApiError(400, "No audio file received");
  }

  const result = await parseVoiceEntry({
    context,
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Voice entry parsed successfully"));
});