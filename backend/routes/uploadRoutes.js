const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");

const router = express.Router();

// Set storage engine for Multer
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(null, "uploaded_video" + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }, // 100MB max file size
});

router.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const videoPath = path.join(__dirname, "../uploads", req.file.filename);

  // Run the Python script to analyze emotions
  exec(`python analysis/emotion_detection.py "${videoPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: "Error processing video" });
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }

    console.log(`Python Script Output: ${stdout}`);
    return res.json({ emotion: stdout.trim() });
  });
});

module.exports = router;
