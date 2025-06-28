const express = require('express');
const db = require('../db'); // Ensure `db` is your database connection module
const router = express.Router();

// Get all orders with user names
router.get('/orders', (req, res) => {
  const sql = `
    SELECT 
      o.order_id, 
      o.date, 
      o.user_id, 
      u.name AS user_name,
      o.net_total, 
      o.status, 
      ot.book_id, 
      b.book_name AS book_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN order_transactions ot ON o.order_id = ot.order_id
    JOIN books b ON ot.book_id = b.book_id
    ORDER BY o.date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    const orders = results.reduce((acc, row) => {
      const { order_id, date, user_id, user_name, net_total, status, book_id, book_name } = row;
      if (!acc[order_id]) {
        acc[order_id] = {
          order_id,
          date,
          user_id,
          user_name,
          net_total,
          status,
          books: []
        };
      }
      acc[order_id].books.push({ book_id, book_name });
      return acc;
    }, {});

    res.json(Object.values(orders));
  });
});

// Update order status
router.put('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['Pending', 'Approved', 'Dispatched', 'Delivered', 'Cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    res.json({ message: 'Order status updated successfully' });
  });
});


// Get orders for a specific user
router.get('/orders/user/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = `
  SELECT 
    o.order_id, 
    o.date, 
    o.user_id, 
    o.net_total, 
    o.status, 
    ot.book_id, 
    b.book_name AS book_name
FROM orders o
JOIN order_transactions ot ON o.order_id = ot.order_id
JOIN books b ON ot.book_id = b.book_id
WHERE o.user_id = ?
ORDER BY o.date DESC
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user orders:', err);
      return res.status(500).json({ error: 'Failed to fetch user orders' });
    }

    // Group orders by order_id
    const orders = results.reduce((acc, row) => {
      const { order_id, date, user_id, net_total, status, book_id, book_name } = row;
      if (!acc[order_id]) {
        acc[order_id] = {
          order_id,
          date,
          user_id,
          net_total,
          status,
          books: []
        };
      }
      acc[order_id].books.push({ book_id, book_name });
      return acc;
    }, {});

    res.json(Object.values(orders));
  });
});

// Get a specific order with its transactions
router.get('/orders/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  
  // First get the order header
  const orderSql = `
    SELECT 
      o.order_id, o.date, o.user_id, o.net_total, o.status
    FROM orders o
    WHERE o.order_id = ?
  `;
  
  // Then get the order transactions
  const transactionsSql = `
    SELECT 
      ot.order_id, ot.book_id, b.book_name, 
      ot.description, ot.price
    FROM order_transactions ot
    JOIN books b ON ot.book_id = b.book_id
    WHERE ot.order_id = ?
  `;
  
  db.query(orderSql, [orderId], (err, orderResult) => {
    if (err) {
      console.error('Error fetching order:', err);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
    
    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    db.query(transactionsSql, [orderId], (err, transactionsResult) => {
      if (err) {
        console.error('Error fetching order transactions:', err);
        return res.status(500).json({ error: 'Failed to fetch order transactions' });
      }
      
      // Combine the results
      const orderWithTransactions = {
        ...orderResult[0],
        transactions: transactionsResult
      };
      
      res.json(orderWithTransactions);
    });
  });
});

// Add a new order
router.post('/orders/add', (req, res) => {
  const { order_id, date, user_id, net_total, books } = req.body;
  
  // Validate required fields
  if (!order_id || !user_id || !net_total || !books || !Array.isArray(books)) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  
  const orderSql = `
    INSERT INTO orders (order_id, date, user_id, net_total, status)
    VALUES (?, ?, ?, ?, 'Pending')
  `;
  
  const orderValues = [
    order_id,
    date || new Date().toISOString().slice(0, 10),
    user_id,
    net_total
  ];
  
  db.query(orderSql, orderValues, (err) => {
    if (err) {
      console.error('Error creating order:', err);
      return res.status(500).json({ error: 'Failed to create order' });
    }
    
    const transactionSql = `
      INSERT INTO order_transactions (order_id, user_id, book_id, description, price)
      VALUES ?
    `;
    
    const transactionValues = books.map(book => [
      order_id,
      user_id,
      book.book_id,
      book.description || null,
      book.price
    ]);
    
    db.query(transactionSql, [transactionValues], (err) => {
      if (err) {
        console.error('Error creating order transactions:', err);
        return res.status(500).json({ error: 'Failed to create order transactions' });
      }
      
      res.status(201).json({ message: 'Order created successfully', order_id });
    });
  });
});

module.exports = router;
