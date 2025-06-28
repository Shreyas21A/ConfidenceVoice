const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for book cover uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/book_covers');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `book_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// Get all books with category name
router.get('/books', (req, res) => {
  const sql = `
    SELECT b.book_id, b.book_name, b.category_id, c.category_name, b.description, b.author,
           b.publisher, b.price, b.status, b.isbn, b.cover_image
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.cat_id
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json(results);
  });
});



// Add new book
router.post('/books', upload.single('cover_image'), (req, res) => {
  const { book_name, category_id, description, author, publisher, price, status, isbn } = req.body;
  const coverImage = req.file ? `/uploads/book_covers/${req.file.filename}` : null;

  const sql = `
    INSERT INTO books (book_name, category_id, description, author, publisher, price, status, isbn, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [book_name, category_id, description, author, publisher, price, status, isbn, coverImage], (err) => {
    if (err) {
      console.error('Error inserting book:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, message: 'Book added successfully' });
  });
});

// Update book
router.put('/books/:id', upload.single('cover_image'), (req, res) => {
  const { id } = req.params;
  const { book_name, category_id, description, author, publisher, price, status, isbn } = req.body;
  const coverImage = req.file ? `/uploads/book_covers/${req.file.filename}` : null;

  let sql = `
    UPDATE books SET book_name = ?, category_id = ?, description = ?, author = ?, publisher = ?, 
    price = ?, status = ?, isbn = ?
  `;
  const values = [book_name, category_id, description, author, publisher, price, status, isbn];

  if (coverImage) {
    sql += `, cover_image = ?`;
    values.push(coverImage);
  }

  sql += ` WHERE book_id = ?`;
  values.push(id);

  db.query(sql, values, (err) => {
    if (err) {
      console.error('Error updating book:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, message: 'Book updated successfully' });
  });
});

// Delete book
router.delete('/books/:id', (req, res) => {
  const { id } = req.params;

  // Optional: delete associated image file (if needed)
  const getCoverQuery = 'SELECT cover_image FROM books WHERE book_id = ?';
  db.query(getCoverQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    const imagePath = results[0]?.cover_image;
    if (imagePath) {
      const fullPath = path.join(__dirname, `..${imagePath}`);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    const deleteSql = 'DELETE FROM books WHERE book_id = ?';
    db.query(deleteSql, [id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Database error' });
      res.json({ success: true, message: 'Book deleted successfully' });
    });
  });
});

module.exports = router;
