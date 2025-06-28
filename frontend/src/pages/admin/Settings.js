import React, { useState, useCallback } from "react";
import axios from "axios";
import {
  Typography,
  Button,
  TextField,
  Alert,
  Box,
  Container,
  Card,
  CardContent,
  ThemeProvider,
  createTheme,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";

// Custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

const Settings = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "newPassword") {
      // Basic password strength check
      if (value.length < 6) {
        setPasswordStrength("Weak");
      } else if (value.length >= 6 && value.match(/[A-Z]/) && value.match(/[0-9]/)) {
        setPasswordStrength("Strong");
      } else {
        setPasswordStrength("Moderate");
      }
    }
  }, []);

  const handleTogglePassword = useCallback((field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleClearForm = useCallback(() => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrorMessage("");
    setSuccessMessage("");
    setPasswordStrength("");
  }, []);

  const handlePasswordChange = async (retries = 3) => {
    setErrorMessage("");
    setSuccessMessage("");

    // Client-side validation
    if (!formData.currentPassword) {
      setErrorMessage("Current password is required.");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }
    if (formData.newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      setErrorMessage("User ID not found. Please log in again.");
      return;
    }

    setLoading(true);
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
        setPasswordStrength("");
      } else {
        setErrorMessage("Incorrect current password.");
      }
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => handlePasswordChange(retries - 1), 1000);
      } else {
        setErrorMessage("An error occurred while changing the password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <AdminHeader />
      <main className="main" style={{ padding: "2rem 0", backgroundColor: "#f5f5f5" }}>
        <Container maxWidth="sm">
          <Typography variant="h4" align="center" gutterBottom>
            Settings
          </Typography>

          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Change Password
              </Typography>

              {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMessage}
                </Alert>
              )}
              {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {successMessage}
                </Alert>
              )}

              <TextField
                label="Current Password"
                type={showPasswords.currentPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleTogglePassword("currentPassword")}
                        aria-label="Toggle current password visibility"
                      >
                        {showPasswords.currentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
                aria-required="true"
              />
              <TextField
                label="New Password"
                type={showPasswords.newPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleTogglePassword("newPassword")}
                        aria-label="Toggle new password visibility"
                      >
                        {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
                helperText={
                  passwordStrength && `Password Strength: ${passwordStrength}`
                }
                aria-required="true"
              />
              <TextField
                label="Confirm New Password"
                type={showPasswords.confirmPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleTogglePassword("confirmPassword")}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
                aria-required="true"
              />

              <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handlePasswordChange}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                  aria-label="Submit password change"
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={handleClearForm}
                  disabled={loading}
                  aria-label="Clear form"
                >
                  Clear
                </Button>
              </Box>
            </CardContent>
          </Card>
          
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
};

export default Settings;