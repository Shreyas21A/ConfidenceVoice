// const express = require('express');
// const db = require('../db');
// const router = express.Router();

// // Register
// router.post('/register', (req, res) => {
//   const { name, email, password, role } = req.body;
//   const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
//   db.query(sql, [name, email, password, role], (err, result) => {
//     if (err) return res.status(500).json({ success: false, message: 'Database error' });
//     res.json({ success: true, message: 'Registration successful' });
//   });
// });

// // Login
// router.post('/login', (req, res) => {
//   const { email, password } = req.body;
//   const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
//   db.query(sql, [email, password], (err, result) => {
//     if (err) return res.status(500).json({ success: false, message: 'Database error' });
//     if (result.length > 0) {
//       res.json({ success: true, role: result[0].role, user_id: result[0].id });
//     } else {
//       res.status(401).json({ success: false, message: 'Invalid credentials' });
//     }
//   });
// });

// // Change Password
// router.post('/change-password', (req, res) => {
//   const { user_id, currentPassword, newPassword } = req.body;

//   if (!user_id || !currentPassword || !newPassword) {
//     return res.status(400).json({ success: false, message: 'All fields are required' });
//   }

//   const sql = 'SELECT * FROM users WHERE id = ?';
//   db.query(sql, [user_id], (err, result) => {
//     if (err) return res.status(500).json({ success: false, message: 'Database error' });

//     if (result.length === 0) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const user = result[0];
    
//     if (user.password !== currentPassword) {
//       return res.status(401).json({ success: false, message: 'Incorrect current password' });
//     }

//     const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
//     db.query(updateSql, [newPassword, user_id], (err) => {
//       if (err) return res.status(500).json({ success: false, message: 'Failed to update password' });

//       res.json({ success: true, message: 'Password updated successfully' });
//     });
//   });
// });

// // Get Users
// router.get('/users', (req, res) => {
//   const sql = 'SELECT id, name, email, role FROM users';
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ success: false, message: 'Database error' });
//     res.json(results);
//   });
// });

// // Delete User
// router.delete('/users/:id', (req, res) => {
//   const { id } = req.params;
//   const sql = 'DELETE FROM users WHERE id = ?';
//   db.query(sql, [id], (err) => {
//     if (err) return res.status(500).json({ success: false, message: 'Database error' });
//     res.json({ success: true, message: 'User deleted successfully' });
//   });
// });

// // Update User
// router.put('/users/:id', (req, res) => {
//   const { id } = req.params;
//   const { name, email, role } = req.body;
//   const sql = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
//   db.query(sql, [name, email, role, id], (err) => {
//     if (err) return res.status(500).json({ success: false, message: 'Database error' });
//     res.json({ success: true, message: 'User updated successfully' });
//   });
// });

// module.exports = router;
const express = require('express');
const db = require('../db');
const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, password, role], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Registration successful' });
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (result.length > 0) {
      res.json({ success: true, role: result[0].role, user_id: result[0].id });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Change Password
router.post('/change-password', (req, res) => {
  const { user_id, currentPassword, newPassword } = req.body;

  if (!user_id || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [user_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result[0];
    
    if (user.password !== currentPassword) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
    db.query(updateSql, [newPassword, user_id], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to update password' });

      res.json({ success: true, message: 'Password updated successfully' });
    });
  });
});

// Get Users
router.get('/users', (req, res) => {
  const sql = 'SELECT id, name, email, role FROM users';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json(results);
  });
});

// Delete User
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'User deleted successfully' });
  });
});

// Update User
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  const sql = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
  db.query(sql, [name, email, role, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'User updated successfully' });
  });
});

// Validate Token
router.post('/validate-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  // Simple token validation: check if user_id exists in users table
  const sql = 'SELECT id, name, email, role FROM users WHERE id = ?';
  db.query(sql, [token], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.json({ success: true, user: results[0] });
  });
});

module.exports = router;