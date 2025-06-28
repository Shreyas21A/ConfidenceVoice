const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all contact messages
router.get('/contact', (req, res) => {
  const sql = `
    SELECT id, name, email, subject, message, created_at
    FROM contacts
    ORDER BY created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching contacts:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json(results);
  });
});

// Submit contact form
router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  const sql = `
    INSERT INTO contacts (name, email, subject, message)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [name, email, subject, message], (err) => {
    if (err) {
      console.error('Error inserting contact:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, message: 'Message sent successfully' });
  });
});

module.exports = router;