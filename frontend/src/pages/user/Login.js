import React, { useState, useCallback } from "react";
import axios from "axios";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
  ThemeProvider,
  createTheme,
  InputAdornment,
  IconButton,
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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(
    localStorage.getItem("keepSignedIn") === "true"
  );
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = useCallback(
    async (retries = 3) => {
      setError("");

      // Client-side validation
      if (!email) {
        setError("Email is required.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!password) {
        setError("Password is required.");
        return;
      }

      setLoading(true);
      try {
        const response = await axios.post("http://localhost:3003/api/auth/login", {
          email,
          password,
        });
        console.log("Login response:", response.data); // Debug
        if (response.data.success) {
          const { role, user_id } = response.data;
          localStorage.setItem("user_id", user_id);
          localStorage.setItem("token", user_id); // Add token
          localStorage.setItem("user", JSON.stringify({ email, role }));
          localStorage.setItem("keepSignedIn", keepSignedIn);
          console.log("localStorage after login:", localStorage); // Debug
          if (role === "Admin") {
            navigate("/admin/dashboard");
          } else if (role === "User") {
            navigate("/home");
          } else {
            setError("Role not recognized.");
          }
        } else {
          setError(response.data.message || "Invalid credentials.");
        }
      } catch (error) {
        console.error("Login error:", error); // Debug
        if (retries > 0) {
          setTimeout(() => handleLogin(retries - 1), 1000);
        } else {
          setError("Failed to connect to server. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, keepSignedIn, navigate]
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
  }, []);

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleKeepSignedIn = useCallback((e) => {
    setKeepSignedIn(e.target.checked);
  }, []);

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
            <img
              src="/assets/img/logo.png"
              alt="Logo"
              style={{ width: "150px", marginBottom: "16px" }}
              onError={() => console.error("Failed to load logo")} // Debug
            />
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Welcome Back!
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Sign in to continue.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={handleChange}
              disabled={loading}
              inputProps={{ "aria-required": "true" }}
            />
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={handleChange}
              disabled={loading}
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

            <FormControlLabel
              control={
                <Checkbox
                  checked={keepSignedIn}
                  onChange={handleKeepSignedIn}
                  disabled={loading}
                />
              }
              label="Keep me signed in"
              sx={{ textAlign: "left", mt: 1 }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleLogin}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
              aria-label="Sign in"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
              <RouterLink
                to="/forgot-password"
                style={{ textDecoration: "none", color: theme.palette.primary.main, fontWeight: "bold" }}
              >
                Forgot password?
              </RouterLink>
            </Box>

            <Typography variant="body2">
              Don't have an account?{" "}
              <RouterLink
                to="/register"
                style={{ textDecoration: "none", color: theme.palette.primary.main, fontWeight: "bold" }}
              >
                Create
              </RouterLink>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Login;