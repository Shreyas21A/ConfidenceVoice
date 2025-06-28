const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/emotion-results", (req, res) => {
  const sql = `
    SELECT id, user_id, confident_percentage, visual_confidence, verbal_confidence, overall_confidence, transcribed_speech, timestamp
    FROM emotion_results
    ORDER BY timestamp DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching emotion results:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json(results);
  });
});

router.get("/audio-results", (req, res) => {
  const sql = `
    SELECT id, user_id, pronunciation, suggestion, most_repeated_word, created_at
    FROM audio_results
    ORDER BY created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching audio results:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json(results);
  });
});

router.get("/analysis-results", (req, res) => {
  const sql = `
    SELECT id, user_id, pronunciation_assessment, most_repeated_word, general_pronunciation_suggestion, confident_percentage, created_at
    FROM analysis_results
    ORDER BY created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching analysis results:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json(results);
  });
});

module.exports = router;