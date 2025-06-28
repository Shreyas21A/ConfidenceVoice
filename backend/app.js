const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const cartRoutes = require('./routes/cartRoutes');
const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderTransactionRoutes = require('./routes/orderTransactionRoutes');
const contactRoutes = require('./routes/contactRoutes');
const orderRoutes = require('./routes/orderRoutes');
const path = require('path');
const cors = require('cors');
const mlRoutes = require("./routes/mlRoutes");


dotenv.config();
const app = express();
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/book_covers', express.static(path.join(__dirname, 'uploads/book_covers')));
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use("/api", uploadRoutes);
app.use('/api', bookRoutes);
app.use('/api', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', paymentRoutes);
app.use('/api', orderRoutes);
app.use('/api', orderTransactionRoutes);
app.use('/api', contactRoutes);
app.use("/api", mlRoutes);
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
