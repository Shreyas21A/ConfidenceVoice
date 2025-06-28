const express = require('express');
const db = require('../db'); // Ensure `db` is your database connection module
const router = express.Router();

// Get all order transactions
router.get('/order-transactions', (req, res) => {
  const sql = `
    SELECT 
      ot.order_id, ot.user_id, u.full_name as username, ot.book_id, 
      b.book_name as book_name, ot.description, ot.price
    FROM order_transactions ot
    JOIN users u ON ot.user_id = u.id
    LEFT JOIN books b ON ot.book_id = b.book_id
    ORDER BY ot.order_id
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching order transactions:', err);
      return res.status(500).json({ error: 'Failed to fetch order transactions' });
    }
    res.json(results);
  });
});

// Get transactions for a specific order
router.get('/order-transactions/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const sql = `
    SELECT 
      ot.order_id, ot.user_id, ot.book_id, b.book_name as book_name,
      ot.description, ot.price
    FROM order_transactions ot
    LEFT JOIN books b ON ot.book_id = b.book_id
    WHERE ot.order_id = ?
    ORDER BY ot.book_id
  `;
  
  db.query(sql, [orderId], (err, results) => {
    if (err) {
      console.error('Error fetching order transactions:', err);
      return res.status(500).json({ error: 'Failed to fetch order transactions' });
    }
    res.json(results);
  });
});

// Get transactions for a specific user
router.get('/order-transactions/user/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT 
      ot.order_id, ot.user_id, ot.book_id, b.book_name as book_name,
      ot.description, ot.price, o.date
    FROM order_transactions ot
    JOIN orders o ON ot.order_id = o.order_id
    LEFT JOIN books b ON ot.book_id = b.book_id
    WHERE ot.user_id = ?
    ORDER BY o.date DESC, ot.order_id
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user order transactions:', err);
      return res.status(500).json({ error: 'Failed to fetch user order transactions' });
    }
    res.json(results);
  });
});

// Add a new order transaction
router.post('/order-transactions/add', (req, res) => {
  const { order_id, user_id, book_id, price, description } = req.body;
  
  // Validate required fields
  if (!order_id || !user_id || !book_id || !price) {
    return res.status(400).json({ error: 'Order ID, User ID, Book ID, and Price are required' });
  }
  
  const sql = `
    INSERT INTO order_transactions (order_id, user_id, book_id, price, description)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const values = [order_id, user_id, book_id, price, description];
  
  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error creating order transaction:', err);
      return res.status(500).json({ 
        error: 'Failed to create order transaction', 
        details: err.message,
        code: err.code
      });
    }
    
    res.status(201).json({ 
      message: 'Order transaction created successfully', 
      transactionId: results.insertId
    });
  });
});

// Update an order transaction
router.put('/order-transactions/:orderId/:bookId', (req, res) => {
  const orderId = req.params.orderId;
  const bookId = req.params.bookId;
  const { description, price } = req.body;
  
  // Build the SQL query dynamically based on which fields are provided
  let updateFields = [];
  let values = [];
  
  if (description) {
    updateFields.push('description = ?');
    values.push(description);
  }
  
  if (price) {
    updateFields.push('price = ?');
    values.push(price);
  }
  
  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  // Add orderId and bookId to values array
  values.push(orderId, bookId);
  
  const sql = `
    UPDATE order_transactions
    SET ${updateFields.join(', ')}
    WHERE order_id = ? AND book_id = ?
  `;
  
  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error updating order transaction:', err);
      return res.status(500).json({ error: 'Failed to update order transaction' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Order transaction not found' });
    }
    
    res.json({ message: 'Order transaction updated successfully' });
  });
});

// Delete a specific order transaction
router.delete('/order-transactions/:orderId/:bookId', (req, res) => {
  const orderId = req.params.orderId;
  const bookId = req.params.bookId;
  
  const sql = 'DELETE FROM order_transactions WHERE order_id = ? AND book_id = ?';
  
  db.query(sql, [orderId, bookId], (err, results) => {
    if (err) {
      console.error('Error deleting order transaction:', err);
      return res.status(500).json({ error: 'Failed to delete order transaction' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Order transaction not found' });
    }
    
    res.json({ message: 'Order transaction deleted successfully' });
  });
});

module.exports = router;
