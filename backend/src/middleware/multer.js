import multer from "multer";

// Memory storage — we only need the buffer momentarily to forward to
// Deepgram; never written to disk.
const storage = multer.memoryStorage();

export const uploadAudio = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — a few minutes of speech is plenty
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are accepted"));
    }
  },
});