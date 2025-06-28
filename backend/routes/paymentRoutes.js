const express = require('express');
const db = require('../db'); // Ensure `db` is your database connection module
const router = express.Router();

// View all payments
router.get('/payments', (req, res) => {
  const sql = `
    SELECT 
      p.id, 
      u.name as username, 
      p.book_id, 
      b.book_name, 
      p.payment_number, 
      p.status, 
      p.date, 
      p.price 
    FROM payments p
    JOIN users u ON p.user_id = u.id
    JOIN books b ON p.book_id = b.book_id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ error: 'Failed to fetch payments' });
    }
    res.json(results);
  });
});

// Update payment status
router.put('/payments/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = `UPDATE payments SET status = ? WHERE id = ?`;
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ error: 'Failed to update status' });
    }
    res.send({ success: true, message: 'Status updated successfully' });
  });
});

// Insert a new payment
router.post('/payments/add', (req, res) => {
  const { 
    user_id, 
    book_id, 
    payment_number, 
    status, 
    date, 
    price,
    payment_method,
    full_name,
    phone_number,
    billing_address,
    pincode,
    // Card details
    card_number,
    card_holder_name,
    card_expiry_month,
    card_expiry_year,
    cvv,
    // UPI details
    upi_id,
    // Netbanking details
    bank_name,
    account_number,
    ifsc_code
  } = req.body;
  
  // Validate required fields
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  if (!price) {
    return res.status(400).json({ error: 'Payment amount is required' });
  }

  if (!full_name) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  if (!phone_number) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  if (!billing_address) {
    return res.status(400).json({ error: 'Billing address is required' });
  }

  if (!pincode) {
    return res.status(400).json({ error: 'Pincode is required' });
  }

  if (!payment_method) {
    return res.status(400).json({ error: 'Payment method is required' });
  }
  
  // Validate payment method specific fields
  if (payment_method === 'credit_card') {
    if (!card_number || !card_holder_name || !card_expiry_month || !card_expiry_year || !cvv) {
      return res.status(400).json({ error: 'All card details are required' });
    }
  } else if (payment_method === 'upi') {
    if (!upi_id) {
      return res.status(400).json({ error: 'UPI ID is required' });
    }
  } else if (payment_method === 'netbanking') {
    if (!bank_name || !account_number || !ifsc_code) {
      return res.status(400).json({ error: 'All netbanking details are required' });
    }
  }
  
  const sql = `
    INSERT INTO payments (
      user_id, 
      book_id, 
      payment_number, 
      status, 
      date, 
      price,
      payment_method,
      full_name,
      phone_number,
      billing_address,
      pincode,
      card_number,
      card_holder_name,
      card_expiry_month,
      card_expiry_year,
      cvv,
      upi_id,
      bank_name,
      account_number,
      ifsc_code
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    user_id,
    book_id || null,
    payment_number || `ORDER-${Date.now()}`,
    status || 'Success',
    date || new Date().toISOString().slice(0, 10),
    price,
    payment_method,
    full_name,
    phone_number,
    billing_address,
    pincode,
    card_number || null,
    card_holder_name || null,
    card_expiry_month || null,
    card_expiry_year || null,
    cvv || null,
    upi_id || null,
    bank_name || null,
    account_number || null,
    ifsc_code || null
  ];
  
  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ 
        error: 'Failed to insert payment', 
        details: err.message,
        code: err.code
      });
    }
    res.status(201).json({ 
      message: 'Payment inserted successfully', 
      paymentId: results.insertId 
    });
  });
});

module.exports = router;
