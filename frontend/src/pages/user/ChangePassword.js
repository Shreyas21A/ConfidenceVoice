import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  ThemeProvider,
  createTheme,
  Breadcrumbs,
  FormControl,
} from "@mui/material";
import { Link } from "react-router-dom";
import { NavigateNext, Lock } from "@mui/icons-material";
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

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle password change submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrorMessage("Password should be at least 6 characters long.");
      return;
    }

    const user_id = localStorage.getItem("user_id");

    if (!user_id) {
      setErrorMessage("User ID not found. Please log in again.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3003/api/auth/change-password", {
        user_id,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        setSuccessMessage("Password changed successfully!");
        setErrorMessage("");
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setErrorMessage(response.data.message || "Incorrect current password.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data || "An error occurred. Please try again.");
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
              Change Password
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 4, maxWidth: "800px", mx: "auto" }}>
              Update your password
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
              <Typography color="text.primary">Change Password</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* Change Password Section */}
        <Box id="change-password" sx={{ py: 6, backgroundColor: "#f5f5f5" }}>
          <Container maxWidth="sm">
            <Card>
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Lock sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 3 }}>
                  Update Your Password
                </Typography>
                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
                    {errorMessage}
                  </Alert>
                )}
                {successMessage && (
                  <Alert severity="success" sx={{ mb: 2, width: "100%" }}>
                    {successMessage}
                  </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <TextField
                      type="password"
                      name="currentPassword"
                      label="Current Password"
                      variant="outlined"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      required
                      aria-label="Current Password"
                    />
                  </FormControl>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <TextField
                      type="password"
                      name="newPassword"
                      label="New Password"
                      variant="outlined"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      aria-label="New Password"
                    />
                  </FormControl>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <TextField
                      type="password"
                      name="confirmPassword"
                      label="Confirm New Password"
                      variant="outlined"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      aria-label="Confirm New Password"
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<Lock />}
                    aria-label="Change Password"
                  >
                    Change Password
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </main>
      <Footer />
    </ThemeProvider>
  );
};

export default ChangePassword;