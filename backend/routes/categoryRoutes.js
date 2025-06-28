const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all categories
router.get('/categories', (req, res) => {
  const sql = 'SELECT * FROM categories';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json(results);
  });
});

// Add new category
router.post('/categories', (req, res) => {
  const { category_name, description, status } = req.body;
  const sql = 'INSERT INTO categories (category_name, description, status) VALUES (?, ?, ?)';
  db.query(sql, [category_name, description, status], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Category added successfully' });
  });
});

// Update category
router.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { category_name, description, status } = req.body;
  const sql = 'UPDATE categories SET category_name = ?, description = ?, status = ? WHERE cat_id = ?';
  db.query(sql, [category_name, description, status, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Category updated successfully' });
  });
});

// Delete category
router.delete('/categories/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM categories WHERE cat_id = ?';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Category deleted successfully' });
  });
});

module.exports = router;
