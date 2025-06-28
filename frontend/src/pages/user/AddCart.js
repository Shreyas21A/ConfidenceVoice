
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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
  IconButton,
  Divider,
} from "@mui/material";
import {
  NavigateNext,
  ArrowUpward,
  Add,
  Remove,
  Delete,
  ShoppingCart,
} from "@mui/icons-material";
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
          "&:hover": {
            transform: "scale(1.02)",
          },
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

function AddCart() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const userId = parseInt(localStorage.getItem("user_id"), 10);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no user ID
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchCart();
  }, [userId, navigate]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`http://localhost:3003/api/cart/${userId}`);
      setCartItems(res.data);
      calculateTotal(res.data);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotal(sum);
  };

  const updateQuantity = async (book_id, delta) => {
    const item = cartItems.find((i) => i.book_id === book_id);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta); // Ensure quantity doesn't go below 1

    try {
      await axios.put(`http://localhost:3003/api/cart/update`, {
        userId,
        bookId: book_id,
        quantity: newQuantity,
      });
      fetchCart(); // Refresh cart after update
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const removeItem = async (book_id) => {
    try {
      await axios.delete(`http://localhost:3003/api/cart/delete`, {
        data: { userId, bookId: book_id },
      });
      fetchCart(); // Refresh cart after deletion
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Generate a unique payment number for this order
    const paymentNumber = `ORDER-${Date.now()}`;

    // Create an array of book details for display in checkout
    const bookDetails = cartItems.map((item) => ({
      book_id: item.book_id,
      book_name: item.book_name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      cover_image: item.cover_image,
      author: item.author,
    }));

    // Navigate to checkout with payment information
    navigate("/checkout", {
      state: {
        amount: total,
        productid: cartItems.map((item) => item.book_id).join(","),
        user_id: userId,
        cartItems: bookDetails,
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <ThemeProvider theme={theme}>
      <Header onLogout={handleLogout} />
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
              Shopping Cart
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 4, maxWidth: "800px", mx: "auto" }}>
              Your selected books are listed below
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
              <Typography color="text.primary">Shopping Cart</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* Add to Cart Section */}
 <section id="add-cart" className="section add-cart">
 <div className="container">
   {cartItems.length === 0 ? (
     <div className="text-center py-5">
       <p className="mb-4">Your cart is empty.</p>
       <Link to="/products" className="btn btn-primary">
         Browse Books
       </Link>
     </div>
   ) : (
     <div className="row gy-4">
       <div className="col-lg-12">
         <div className="card shadow-sm border mb-4">
           <div className="card-header bg-white">
             <h4 className="mb-0">Your Cart Items</h4>
           </div>
           <div className="card-body p-0">
             {cartItems.map((item) => (
               <div key={item.book_id} className="d-flex align-items-center border-bottom p-3">
                 <img
                   src={`http://localhost:3003${item.cover_image}`}
                   alt={item.book_name}
                   className="me-3"
                   style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '4px' }}
                 />
                 <div className="flex-grow-1">
                   <h5 className="mb-1">{item.book_name}</h5>
                   <p className="mb-1 text-muted">by {item.author}</p>
                   <p className="mb-2">Price: ₹{Number(item.price).toFixed(2)}</p>
                   <div className="d-flex align-items-center">
                     <div className="input-group" style={{ width: '120px' }}>
                       <button className="btn btn-sm btn-outline-secondary"
                               onClick={() => updateQuantity(item.book_id, -1)}>-</button>
                       <input type="text" className="form-control text-center" value={item.quantity} readOnly />
                       <button className="btn btn-sm btn-outline-secondary"
                               onClick={() => updateQuantity(item.book_id, 1)}>+</button>
                     </div>
                     <button className="btn btn-sm btn-outline-danger ms-3"
                             onClick={() => removeItem(item.book_id)}>
                       <i className="bi bi-trash"></i> Remove
                     </button>
                   </div>
                 </div>
                 <div className="text-end ms-auto">
                   <h5>₹{(item.price * item.quantity).toFixed(2)}</h5>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
       
       <div className="col-lg-12">
         <div className="card shadow-sm border">
           <div className="card-body">
             <h4 className="card-title mb-4">Order Summary</h4>
             
             <div className="d-flex justify-content-between mb-2">
               <span>Subtotal</span>
               <span>₹{total.toFixed(2)}</span>
             </div>
             
             <div className="d-flex justify-content-between mb-2">
               <span>Shipping</span>
               <span>Free</span>
             </div>
             
             <hr />
             
             <div className="d-flex justify-content-between mb-4">
               <h5>Total</h5>
               <h5>₹{total.toFixed(2)}</h5>
             </div>
             
             <div className="d-flex justify-content-between">
               <Link to="/products" className="btn btn-outline-primary">
                 Continue Shopping
               </Link>
               <button 
                 className="btn btn-primary" 
                 onClick={handleCheckout}
                 disabled={cartItems.length === 0}
               >
                 Proceed to Checkout
               </button>
             </div>
           </div>
         </div>
       </div>
     </div>
   )}
 </div>
</section>

      </main>
      <Footer />
      <IconButton
        href="#"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          backgroundColor: theme.palette.primary.main,
          color: "#fff",
          "&:hover": { backgroundColor: theme.palette.primary.dark },
        }}
        aria-label="Scroll to top"
      >
        <ArrowUpward />
      </IconButton>
    </ThemeProvider>
  );
}

export default AddCart;