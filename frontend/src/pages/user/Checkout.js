import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  ThemeProvider,
  createTheme,
  Breadcrumbs,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Divider,
} from "@mui/material";
import { NavigateNext, Payment } from "@mui/icons-material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Define button styles separately to avoid circular reference
const buttonStyles = {
  root: {
    borderRadius: 8,
    padding: "12px 24px",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "scale(1.05)",
      backgroundColor: "#1565C0", // Hardcode primary.dark
    },
  },
};

// Custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
        },
      },
    },
    MuiButton: {
      styleOverrides: buttonStyles,
    },
  },
});

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, productid, user_id: passedUserId, singleBook, cartItems: passedCartItems } = location.state || {};
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({ name: "", address: "", pincode: "" });
  const [paymentDetails, setPaymentDetails] = useState({});
  const [errors, setErrors] = useState({});
  const userId = passedUserId || localStorage.getItem("user_id");

  // Validation patterns and error messages
  const validationPatterns = {
    name: /^[a-zA-Z\s]{2,50}$/,
    address: /.+/,
    pincode: /^[0-9]{6}$/,
    cardHolder: /^[a-zA-Z\s]{2,50}$/,
    cardNumber: /^[0-9]{16}$/,
    expiryMonth: /^(0[1-9]|1[0-2])$/,
    expiryYear: /^20[2-9][0-9]$/,
    cvv: /^[0-9]{3}$/,
    upiId: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/,
    accountNumber: /^[0-9]{9,18}$/,
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  };

  const errorMessages = {
    name: "Name should contain only letters and spaces (2-50 characters)",
    address: "Billing address is required",
    pincode: "Pincode should be exactly 6 digits",
    cardHolder: "Name should contain only letters and spaces (2-50 characters)",
    cardNumber: "Card number should be exactly 16 digits",
    expiryMonth: "Month should be between 01-12",
    expiryYear: "Year should be valid (2024-2029)",
    cvv: "CVV should be exactly 3 digits",
    upiId: "Please enter a valid UPI ID (e.g., name@upi)",
    bankName: "Bank name is required",
    accountNumber: "Account number should be 9-18 digits",
    ifsc: "Please enter a valid IFSC code",
  };

  useEffect(() => {
    if (!passedUserId && !localStorage.getItem("user_id")) {
      alert("Please log in to continue with checkout");
      navigate("/login");
      return;
    }

    // Handle items to display in checkout
    if (singleBook) {
      // Direct Buy Now case
      setItems([{ ...singleBook, quantity: 1 }]);
    } else if (passedCartItems && passedCartItems.length > 0) {
      // Checkout from cart with passed items
      setItems(passedCartItems);
    } else {
      // Fallback - fetch cart items if not provided
      fetchCartItems();
    }
  }, [location, passedUserId, navigate, singleBook, passedCartItems]);

  const fetchCartItems = async () => {
    try {
      const res = await axios.get(`http://localhost:3003/api/cart/${userId}`);
      if (res.data.length === 0) {
        alert("Your cart is empty");
        navigate("/home");
        return;
      }
      setItems(res.data);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      alert("Failed to fetch cart items. Please try again.");
    }
  };

  const validateField = (name, value) => {
    const pattern = validationPatterns[name];
    if (!pattern) return value.trim() !== "";
    return pattern.test(value);
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo({ ...shippingInfo, [name]: value });
    if (value) {
      const isValid = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: isValid ? "" : errorMessages[name] }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePaymentDetailChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({ ...paymentDetails, [name]: value });
    if (value) {
      const isValid = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: isValid ? "" : errorMessages[name] }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!shippingInfo.name || !validateField("name", shippingInfo.name))
      newErrors.name = errorMessages.name;
    if (!shippingInfo.address || !validateField("address", shippingInfo.address))
      newErrors.address = errorMessages.address;
    if (!shippingInfo.pincode || !validateField("pincode", shippingInfo.pincode))
      newErrors.pincode = errorMessages.pincode;

    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method.";
    } else if (paymentMethod === "credit_card") {
      ["cardHolder", "cardNumber", "expiryMonth", "expiryYear", "cvv"].forEach((field) => {
        if (!paymentDetails[field] || !validateField(field, paymentDetails[field])) {
          newErrors[field] = errorMessages[field];
        }
      });
    } else if (paymentMethod === "upi") {
      if (!paymentDetails.upiId || !validateField("upiId", paymentDetails.upiId))
        newErrors.upiId = errorMessages.upiId;
    } else if (paymentMethod === "netbanking") {
      ["bankName", "accountNumber", "ifsc"].forEach((field) => {
        if (!paymentDetails[field] || !validateField(field, paymentDetails[field])) {
          newErrors[field] = errorMessages[field];
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const orderId = `ORDER-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString().slice(0, 10);

      // Calculate total amount based on items
      const totalAmount = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

      // Prepare books array for order creation
      const books = singleBook
        ? [{ book_id: singleBook.book_id, price: singleBook.price, description: `Direct purchase: ${singleBook.book_name}` }]
        : items.map((item) => ({
            book_id: item.book_id,
            price: item.price,
            description: `Purchase: ${item.book_name}`,
          }));

      // Create order
      await axios.post("http://localhost:3003/api/orders/add", {
        order_id: orderId,
        date: now,
        user_id: userId,
        net_total: totalAmount,
        books: books,
      });

      // Handle single product (Buy Now) or multiple products (Cart)
      if (singleBook) {
        // Direct purchase case
        await axios.post("http://localhost:3003/api/order-transactions/add", {
          order_id: orderId,
          user_id: userId,
          book_id: singleBook.book_id,
          quantity: 1,
          price: singleBook.price,
          description: `Direct purchase: ${singleBook.book_name}`,
        });
      } else {
        // Cart checkout case
        for (const item of items) {
          await axios.post("http://localhost:3003/api/order-transactions/add", {
            order_id: orderId,
            user_id: userId,
            book_id: item.book_id,
            quantity: item.quantity,
            price: item.price,
            description: `Purchase: ${item.book_name}`,
          });
        }

        // Clear cart after successful checkout
        await axios.delete(`http://localhost:3003/api/cart/clear/${userId}`);
      }

      // Record payment details
      const paymentPayload = {
        user_id: userId,
        book_id: singleBook ? singleBook.book_id : items[0].book_id,
        payment_number: orderId,
        status: paymentMethod === "cod" ? "Pending" : "Success",
        payment_date: now,
        price: totalAmount,
        payment_method: paymentMethod,
        full_name: shippingInfo.name,
        phone_number: "0000000000", // Consider collecting this
        billing_address: shippingInfo.address,
        pincode: shippingInfo.pincode,
      };

      // Add payment method-specific details
      if (paymentMethod === "credit_card") {
        paymentPayload.card_number = paymentDetails.cardNumber;
        paymentPayload.card_holder_name = paymentDetails.cardHolder;
        paymentPayload.card_expiry_month = paymentDetails.expiryMonth;
        paymentPayload.card_expiry_year = paymentDetails.expiryYear;
        paymentPayload.cvv = paymentDetails.cvv;
      } else if (paymentMethod === "upi") {
        paymentPayload.upi_id = paymentDetails.upiId;
      } else if (paymentMethod === "netbanking") {
        paymentPayload.bank_name = paymentDetails.bankName;
        paymentPayload.account_number = paymentDetails.accountNumber;
        paymentPayload.ifsc_code = paymentDetails.ifsc;
      }

      const response = await axios.post("http://localhost:3003/api/payments/add", paymentPayload);

      if (response.data.paymentId) {
        navigate("/payment/success", {
          state: {
            paymentId: response.data.paymentId,
            paymentNumber: orderId,
            totalAmount: totalAmount,
          },
        });
      } else {
        alert(
          paymentMethod === "cod"
            ? "Order placed successfully! Payment will be collected on delivery."
            : "Payment successful!"
        );
        navigate("/home");
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <main className="main">
        {/* Page Title Section */}
        <Box
          sx={{
            py: 8,
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            textAlign: "center",
          }}
        >
          <Container>
            <Typography variant="h1" sx={{ color: "#000", mb: 2 }}>
              Checkout
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 4, maxWidth: "800px", mx: "auto" }}>
              Complete your purchase
            </Typography>
            <Breadcrumbs
              separator={<NavigateNext fontSize="small" />}
              aria-label="breadcrumb"
              sx={{ justifyContent: "center", display: "flex" }}
            >
              <Link
                to="/home"
                style={{ color: theme.palette.primary.main, textDecoration: "none" }}
                aria-label="Home"
              >
                Home
              </Link>
              <Typography color="text.primary">Checkout</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* Checkout Section */}
        <Box id="checkout" sx={{ py: 6, backgroundColor: "#f5f5f5" }}>
          <Container>
            <Grid container spacing={4}>
              {/* Order Items, Shipping, and Payment */}
              <Grid item xs={12} lg={8}>
                {/* Order Items */}
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ mb: 3 }}>
                      Order Items
                    </Typography>
                    {items.map((item) => (
                      <Box
                        key={item.book_id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          py: 2,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <img
                          src={`http://localhost:3003${item.cover_image}`}
                          alt={item.book_name}
                          className="me-3"
                          style={{ width: '80px', height: '120px', objectFit: 'cover' }}
                        />
                        <div className="flex-grow-1">
                          <h5 className="mb-1">{item.book_name}</h5>
                          <p className="mb-1 text-muted">by {item.author}</p>
                          <p className="mb-2">Price: ₹{Number(item.price).toFixed(2)}</p>
                          <p className="mb-0">Quantity: {item.quantity || 1}</p>
                        </div>
                        
                        <Typography variant="h5" sx={{ textAlign: "right", ml: "auto" }}>
                          ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ mb: 3 }}>
                      Shipping Information
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <TextField
                        label="Full Name"
                        name="name"
                        value={shippingInfo.name}
                        onChange={handleShippingChange}
                        error={!!errors.name}
                        helperText={errors.name}
                        aria-label="Full Name"
                      />
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <TextField
                        label="Billing Address"
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleShippingChange}
                        multiline
                        rows={3}
                        error={!!errors.address}
                        helperText={errors.address}
                        aria-label="Billing Address"
                      />
                    </FormControl>
                    <FormControl fullWidth>
                      <TextField
                        label="Pincode"
                        name="pincode"
                        value={shippingInfo.pincode}
                        onChange={handleShippingChange}
                        error={!!errors.pincode}
                        helperText={errors.pincode}
                        aria-label="Pincode"
                      />
                    </FormControl>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardContent>
                    <Typography variant="h4" sx={{ mb: 3 }}>
                      Payment Method
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id="payment-method-label">Payment Method</InputLabel>
                      <Select
                        labelId="payment-method-label"
                        label="Payment Method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        aria-label="Select Payment Method"
                      >
                        <MenuItem value="credit_card">Credit Card</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="netbanking">Net Banking</MenuItem>
                        <MenuItem value="cod">Cash on Delivery</MenuItem>
                      </Select>
                      {errors.paymentMethod && (
                        <FormHelperText error>{errors.paymentMethod}</FormHelperText>
                      )}
                    </FormControl>

                    {paymentMethod === "credit_card" && (
                      <Box>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <TextField
                            label="Card Holder Name"
                            name="cardHolder"
                            value={paymentDetails.cardHolder || ""}
                            onChange={handlePaymentDetailChange}
                            error={!!errors.cardHolder}
                            helperText={errors.cardHolder}
                            aria-label="Card Holder Name"
                          />
                        </FormControl>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <TextField
                            label="Card Number"
                            name="cardNumber"
                            value={paymentDetails.cardNumber || ""}
                            onChange={handlePaymentDetailChange}
                            error={!!errors.cardNumber}
                            helperText={errors.cardNumber}
                            aria-label="Card Number"
                          />
                        </FormControl>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                              <TextField
                                label="Expiry Month"
                                name="expiryMonth"
                                value={paymentDetails.expiryMonth || ""}
                                onChange={handlePaymentDetailChange}
                                placeholder="MM"
                                error={!!errors.expiryMonth}
                                helperText={errors.expiryMonth}
                                aria-label="Expiry Month"
                              />
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                              <TextField
                                label="Expiry Year"
                                name="expiryYear"
                                value={paymentDetails.expiryYear || ""}
                                onChange={handlePaymentDetailChange}
                                placeholder="YYYY"
                                error={!!errors.expiryYear}
                                helperText={errors.expiryYear}
                                aria-label="Expiry Year"
                              />
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                              <TextField
                                label="CVV"
                                name="cvv"
                                value={paymentDetails.cvv || ""}
                                onChange={handlePaymentDetailChange}
                                error={!!errors.cvv}
                                helperText={errors.cvv}
                                aria-label="CVV"
                              />
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {paymentMethod === "upi" && (
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <TextField
                          label="UPI ID"
                          name="upiId"
                          value={paymentDetails.upiId || ""}
                          onChange={handlePaymentDetailChange}
                          placeholder="name@upi"
                          error={!!errors.upiId}
                          helperText={errors.upiId}
                          aria-label="UPI ID"
                        />
                      </FormControl>
                    )}

                    {paymentMethod === "netbanking" && (
                      <Box>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <TextField
                            label="Bank Name"
                            name="bankName"
                            value={paymentDetails.bankName || ""}
                            onChange={handlePaymentDetailChange}
                            error={!!errors.bankName}
                            helperText={errors.bankName}
                            aria-label="Bank Name"
                          />
                        </FormControl>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <TextField
                            label="Account Number"
                            name="accountNumber"
                            value={paymentDetails.accountNumber || ""}
                            onChange={handlePaymentDetailChange}
                            error={!!errors.accountNumber}
                            helperText={errors.accountNumber}
                            aria-label="Account Number"
                          />
                        </FormControl>
                        <FormControl fullWidth>
                          <TextField
                            label="IFSC Code"
                            name="ifsc"
                            value={paymentDetails.ifsc || ""}
                            onChange={handlePaymentDetailChange}
                            error={!!errors.ifsc}
                            helperText={errors.ifsc}
                            aria-label="IFSC Code"
                          />
                        </FormControl>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Order Summary */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" sx={{ mb: 3 }}>
                      Order Summary
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="body1">Subtotal</Typography>
                      <Typography variant="body1">
                        ₹{items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="body1">Shipping</Typography>
                      <Typography variant="body1">Free</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
                      <Typography variant="h5">Total</Typography>
                      <Typography variant="h5">
                        ₹{items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handlePayment}
                      disabled={loading}
                      startIcon={<Payment />}
                      aria-label="Complete Purchase"
                    >
                      {loading ? "Processing..." : "Complete Purchase"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default Checkout;