import React, { useState, useCallback } from "react";
import axios from "axios";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  ThemeProvider,
  createTheme,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

// Custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      // Password strength check
      if (value.length < 8) {
        setPasswordStrength("Weak");
      } else if (value.length >= 8 && value.match(/[A-Z]/) && value.match(/[0-9]/)) {
        setPasswordStrength("Strong");
      } else {
        setPasswordStrength("Moderate");
      }
    }
  }, []);

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (e, retries = 3) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      // Client-side validation
      if (!formData.name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!formData.email.trim()) {
        setError("Please enter your email address.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!formData.password) {
        setError("Please enter a password.");
        return;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      setLoading(true);
      try {
        await axios.post("http://localhost:3003/api/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "user",
        });

        setSuccess("Registration successful! Redirecting to login...");
        setError("");
        setTimeout(() => navigate("/"), 2000);
      } catch (error) {
        if (retries > 0) {
          setTimeout(() => handleSubmit(e, retries - 1), 1000);
        } else {
          setError("Registration failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate]
  );

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
          padding: 2,
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
            <Box sx={{ mb: 2 }}>
              <img
                src="assets/img/logo.png"
                alt="Logo"
                style={{ width: "150px", marginBottom: "16px" }}
              />
            </Box>
            <Typography component="h1" variant="h5" sx={{ fontWeight: "bold" }}>
              Join ConfidentVoice
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Step into confidence and start your speaking journey today.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Username"
                name="name"
                autoComplete="username"
                autoFocus
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                inputProps={{ "aria-required": "true" }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                inputProps={{ "aria-required": "true" }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                helperText={
                  passwordStrength
                    ? `Password Strength: ${passwordStrength}`
                    : "Password must be at least 8 characters long"
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        aria-label="Toggle password visibility"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{ "aria-required": "true" }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 3,
                  mb: 2,
                  fontSize: "16px",
                  fontWeight: "bold",
                  padding: "12px",
                  borderRadius: "8px",
                  transition: "all 0.3s ease",
                  "&:hover": { backgroundColor: theme.palette.primary.dark, transform: "scale(1.05)" },
                }}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
                aria-label="Create Account"
              >
                {loading ? "Creating Account..." : "Create Your Account"}
              </Button>
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Typography variant="body2">
                  Already registered?{" "}
                  <Link
                    component={RouterLink}
                    to="/"
                    variant="body2"
                    sx={{ color: theme.palette.primary.main, fontWeight: "bold" }}
                  >
                    Login to your account
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Register;