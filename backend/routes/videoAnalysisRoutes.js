const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Configure Multer for file upload
const upload = multer({ dest: "uploads/" });

router.post("/analyze", upload.single("video"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
    }

    const videoPath = path.join(__dirname, "..", req.file.path);
    console.log("Received video for analysis:", videoPath);

    // Spawn Python process
    const pythonProcess = spawn("python", ["C:\\confidenceSpeaker\\backend\\analysis\\emotion_detection.py", videoPath]);

    let output = "";

    pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error("Python Debug:", data.toString());  // Logs debug output but doesn't break JSON parsing
    });

    pythonProcess.on("close", (code) => {
        console.log("Python process exited with code", code);

        if (!output.trim()) {
            return res.status(500).json({ error: "No output from emotion analysis script" });
        }

        try {
            const result = JSON.parse(output.trim());
            
            if (result.error) {
                console.error("Emotion Detection Error:", result.error);
                return res.status(500).json({ error: result.error });
            }

            res.json(result);

            // Delete uploaded file after processing (optional)
            fs.unlink(videoPath, (err) => {
                if (err) console.error("Error deleting video:", err);
            });
        } catch (error) {
            console.error("JSON Parsing Error:", error);
            res.status(500).json({ error: "Invalid response from Python script" });
        }
    });
});

module.exports = router;
