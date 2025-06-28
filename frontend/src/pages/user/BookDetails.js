import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
} from "@mui/material";
import { AddShoppingCart, ShoppingCartCheckout, NavigateNext } from "@mui/icons-material";
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
    h3: { fontWeight: 600 },
    h4: { fontWeight: 700 },
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
        },
      },
    },
    MuiButton: {
      styleOverrides: buttonStyles,
    },
  },
});

function BookDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const book = location.state?.book;

  // Redirect to /products if no book data is provided
  if (!book) {
    navigate("/products");
    return null;
  }

  const handleAddToCart = async () => {
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

  const handleBuyNow = () => {
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
              {book.book_name}
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 4, maxWidth: "800px", mx: "auto" }}>
              Explore the details of this book
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
              <Link
                to="/products"
                style={{ color: theme.palette.primary.main, textDecoration: "none" }}
                aria-label="Books"
              >
                Books
              </Link>
              <Typography color="text.primary">{book.book_name}</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* Book Details Section */}
        <Box id="book-details" sx={{ py: 6, backgroundColor: "#f5f5f5" }}>
          <Container>
            <Card>
              <CardContent>
                <Grid container spacing={4}>
                  {/* Book Image */}
                  <Grid item xs={12} md={4}>
                    <img
                      src={`http://localhost:3003${book.cover_image}`}
                      alt={book.book_name}
                      style={{
                        width: "200px",
                        height: "280px",
                        objectFit: "cover",
                        borderRadius: "5px",
                        margin: "0 auto",
                        display: "block",
                      }}
                    />
                  </Grid>

                  {/* Book Details */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="h3" sx={{ mb: 2, fontSize: "24px" }}>
                      {book.book_name}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Author:</strong> {book.author}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Publisher:</strong> {book.publisher}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Category:</strong> {book.category_name}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>ISBN:</strong> {book.isbn}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Price:</strong> ₹{book.price}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      <strong>Description:</strong> {book.description}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AddShoppingCart />}
                        onClick={handleAddToCart}
                        aria-label={`Add ${book.book_name} to cart`}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ShoppingCartCheckout />}
                        onClick={handleBuyNow}
                        aria-label={`Buy ${book.book_name} now`}
                      >
                        Buy Now
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default BookDetails;