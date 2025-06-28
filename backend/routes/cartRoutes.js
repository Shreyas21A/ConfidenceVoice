// routes/cartRoutes.js

const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all cart items for a specific user
router.get("/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT c.*, b.book_name, b.cover_image, b.author 
    FROM cart c
    JOIN books b ON c.book_id = b.book_id
    WHERE c.id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching cart items:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    res.json(results);
  });
});

// POST /api/cart/add
router.post('/add', (req, res) => {
    const { user_id, book_id, price } = req.body;
    if (!user_id || !book_id || !price) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
  
    const checkQuery = 'SELECT * FROM cart WHERE id = ? AND book_id = ?';
    db.query(checkQuery, [user_id, book_id], (err, results) => {
      if (err) {
        console.error('Error checking cart:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
  
      if (results.length > 0) {
        // If book already in cart, increment quantity
        const updateQuery = 'UPDATE cart SET quantity = quantity + 1 WHERE id = ? AND book_id = ?';
        db.query(updateQuery, [user_id, book_id], (err) => {
          if (err) {
            console.error('Error updating cart quantity:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }
          res.json({ success: true, message: 'Quantity updated in cart' });
        });
      } else {
        // If book not in cart, insert new row
        const insertQuery = 'INSERT INTO cart (id, book_id, quantity, price) VALUES (?, ?, 1, ?)';
        db.query(insertQuery, [user_id, book_id, price], (err) => {
          if (err) {
            console.error('Error inserting into cart:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }
          res.json({ success: true, message: 'Book added to cart' });
        });
      }
    });
  });
  

// Update quantity directly
router.put("/update", (req, res) => {
  const { userId, bookId, quantity } = req.body;

  if (!userId || !bookId || quantity == null) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const sql = "UPDATE cart SET quantity = ? WHERE id = ? AND book_id = ?";
  db.query(sql, [quantity, userId, bookId], (err) => {
    if (err) {
      console.error("Error updating quantity:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, message: "Quantity updated" });
  });
});

// Delete item from cart
router.delete("/delete", (req, res) => {
  const { userId, bookId } = req.body;

  if (!userId || !bookId) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const sql = "DELETE FROM cart WHERE id = ? AND book_id = ?";
  db.query(sql, [userId, bookId], (err) => {
    if (err) {
      console.error("Error deleting cart item:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, message: "Item removed from cart" });
  });
});

// Update cart item quantity
router.put('/update/:id', (req, res) => {
  const { quantity } = req.body;
  const cartItemId = req.params.id;
  
  const sql = 'UPDATE cart SET quantity = ? WHERE id = ?';
  db.query(sql, [quantity, cartItemId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update quantity' });
    }
    res.json({ message: 'Quantity updated successfully' });
  });
});

// Remove item from cart
router.delete('/:id', (req, res) => {
  const cartItemId = req.params.id;
  
  const sql = 'DELETE FROM cart WHERE id = ?';
  db.query(sql, [cartItemId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to remove item' });
    }
    res.json({ message: 'Item removed successfully' });
  });
});
// Clear cart after checkout
router.delete('/clear/:userId', (req, res) => {
  const userId = req.params.userId;

  const sql = 'DELETE FROM cart WHERE id = ?';
  db.query(sql, [userId], (err) => {
    if (err) {
      console.error('Error clearing cart:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Cart cleared successfully' });
  });
});


module.exports = router;
