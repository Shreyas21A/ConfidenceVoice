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
  TextField,
  Breadcrumbs,
  IconButton,
} from "@mui/material";
import {
  AddShoppingCart,
  ShoppingCartCheckout,
  NavigateNext,
  ArrowUpward,
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
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
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
          height: "100%",
        },
      },
    },
    MuiButton: {
      styleOverrides: buttonStyles,
    },
  },
});

function Products() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    // Check if user is logged in, redirect to login if not
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchBooks();
    fetchCategories();
  }, [userId, navigate]);

  const fetchBooks = async () => {
    try {
      const res = await axios.get("http://localhost:3003/api/books");
      setBooks(res.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3003/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filteredBooks = books.filter((book) => {
    const term = searchTerm.toLowerCase();
    return (
      book.status === "Active" &&
      (book.book_name.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        (book.category_name || "").toLowerCase().includes(term))
    );
  });

  const handleAddToCart = async (book) => {
    if (!userId) {
      alert("Please log in to add items to cart");
      navigate("/login");
      return;
    }

    try {
      const cartResponse = await axios.get(`http://localhost:3003/api/cart/${userId}`);
      const cartItems = cartResponse.data;

      const existingItem = cartItems.find((cartItem) => cartItem.book_id === book.book_id);

      if (existingItem) {
        await axios.put(`http://localhost:3003/api/cart/update/${existingItem.id}`, {
          quantity: existingItem.quantity + 1,
          user_id: userId,
          book_id: book.book_id,
          price: book.price,
          book_name: book.book_name,
          author: book.author,
          cover_image: book.cover_image,
        });
      } else {
        await axios.post("http://localhost:3003/api/cart/add", {
          user_id: userId,
          book_id: book.book_id,
          quantity: 1,
          price: book.price,
          book_name: book.book_name,
          author: book.author,
          cover_image: book.cover_image,
        });
      }

      alert("Item added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Error adding item to cart. Please try again.");
    }
  };

  const handleBuyNow = (book) => {
    if (!userId) {
      alert("Please log in to make a purchase");
      navigate("/login");
      return;
    }

    navigate("/checkout", {
      state: {
        amount: book.price,
        productid: book.book_id,
        user_id: userId,
        singleBook: {
          book_id: book.book_id,
          book_name: book.book_name,
          price: book.price,
          quantity: 1,
          cover_image: book.cover_image,
          author: book.author,
        },
      },
    });
  };

  const processDirectPayment = async (paymentData) => {
    try {
      const response = await axios.post("http://localhost:3003/api/payments/add", paymentData);
      if (response.data.paymentId) {
        alert("Payment successful!");
        navigate("/payment/success", {
          state: {
            paymentId: response.data.paymentId,
            paymentNumber: paymentData.payment_number,
            totalAmount: paymentData.total_amount,
          },
        });
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment processing failed. Please try again.");
    }
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
              Books
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 4, maxWidth: "800px", mx: "auto" }}>
              Enhance your public speaking skills with these amazing books!
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
              <Typography color="text.primary">Books</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* Search Input */}
        <Box sx={{ py: 4, backgroundColor: "#f5f5f5" }}>
          <Container>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by title, author, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search books"
              sx={{ maxWidth: "600px", mx: "auto" }}
            />
          </Container>
        </Box>

        {/* Books by Category Section */}
        <Box id="books" sx={{ py: 6, backgroundColor: "#fff" }}>
          <Container>
            {categories.map((cat) => {
              const booksInCategory = filteredBooks.filter((book) => book.category_id === cat.cat_id);
              if (booksInCategory.length === 0) return null;

              return (
                <Box key={cat.cat_id} sx={{ mb: 6 }}>
                  <Typography variant="h2" sx={{ mb: 3 }}>
                    {cat.category_name}
                  </Typography>
                  <Grid container spacing={4}>
                    {booksInCategory.map((book) => (
                      <Grid item xs={12} sm={6} lg={4} key={book.book_id}>
                        <Card>
                          <CardContent sx={{ textAlign: "center", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                            <Link
                              to={`/book/${book.book_id}`}
                              state={{ book }}
                              style={{ textDecoration: "none" }}
                            >
                              <img
                                src={`http://localhost:3003${book.cover_image}`}
                                alt={book.book_name}
                                style={{
                                  width: "200px",
                                  height: "280px",
                                  objectFit: "cover",
                                  borderRadius: "5px",
                                  margin: "0 auto",
                                  cursor: "pointer",
                                }}
                              />
                            </Link>
                            <Typography
                              variant="h3"
                              sx={{
                                mt: 2,
                                mb: 1,
                                fontSize: "18px",
                                height: "50px",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {book.book_name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                              by {book.author}
                            </Typography>
                            <Typography variant="h6" sx={{ color: theme.palette.accent.main, mb: 2 }}>
                              ₹{book.price}
                            </Typography>
                            <Box sx={{ mt: "auto", display: "flex", justifyContent: "center", gap: 2 }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddShoppingCart />}
                                onClick={() => handleAddToCart(book)}
                                aria-label={`Add ${book.book_name} to cart`}
                              >
                                Add to Cart
                              </Button>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<ShoppingCartCheckout />}
                                onClick={() => handleBuyNow(book)}
                                aria-label={`Buy ${book.book_name} now`}
                              >
                                Buy Now
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })}
          </Container>
        </Box>
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

export default Products;