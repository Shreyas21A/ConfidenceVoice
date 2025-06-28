import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  ThemeProvider,
  createTheme,
  Breadcrumbs,
} from "@mui/material";
import { NavigateNext, CheckCircle, Home } from "@mui/icons-material";
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
    h3: { fontWeight: 700 },
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

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentId, paymentNumber, totalAmount } = location.state || {};

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
              Payment Success
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 4, maxWidth: "800px", mx: "auto" }}>
              Thank you for your purchase! Your payment was processed successfully.
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
              <Typography color="text.primary">Payment Success</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* Success Section */}
        <Box id="payment-success" sx={{ py: 6, backgroundColor: "#f5f5f5" }}>
          <Container>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Card sx={{ maxWidth: "600px", width: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <CheckCircle sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />
                  <Typography variant="h3" sx={{ mb: 3 }}>
                    Payment Details
                  </Typography>
                  {paymentId ? (
                    <Box>
                      {/* <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Payment ID:</strong> {paymentId}
                      </Typography> */}
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Order Number:</strong> {paymentNumber}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        <strong>Total Amount:</strong> ₹{totalAmount}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 3 }}>
                        Your order is now confirmed and being processed.
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      Your order has been placed successfully!
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Home />}
                    onClick={() => navigate("/home")}
                    aria-label="Go to Home"
                  >
                    Go to Home
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Container>
        </Box>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default PaymentSuccess;