import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  FormControl,
  Alert,
} from "@mui/material";
import { NavigateNext, LocationOn, Phone, Email, Send } from "@mui/icons-material";
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

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [formStatus, setFormStatus] = useState({
    isSubmitting: false,
    errorMessage: "",
    sentMessage: "",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  // Fetch logged-in user's email on mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const token = localStorage.getItem("token"); // user_id stored as token
      if (!token) {
        setAuthError("Please log in to send a message.");
        return;
      }

      try {
        const response = await axios.post("http://localhost:3003/api/auth/validate-token", { token });
        if (response.data.success && response.data.user.email) {
          setFormData((prev) => ({ ...prev, email: response.data.user.email }));
          setIsAuthenticated(true);
        } else {
          setAuthError("Unable to fetch user details. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
        setAuthError("Authentication failed. Please log in again.");
      }
    };

    fetchUserEmail();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Your Name is required";
    if (!formData.email.trim()) {
      errors.email = "Your Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Your Email is invalid";
    }
    if (!formData.subject.trim()) errors.subject = "Subject is required";
    if (!formData.message.trim()) errors.message = "Message is required";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setFormStatus({ isSubmitting: true, errorMessage: "", sentMessage: "" });

    try {
      const response = await axios.post("http://localhost:3003/api/contact", formData);
      if (response.data.success) {
        setFormStatus({
          isSubmitting: false,
          errorMessage: "",
          sentMessage: "Your message has been sent successfully!",
        });
        setFormData({ name: "", email: formData.email, subject: "", message: "" });
        setErrors({});
      } else {
        setFormStatus({
          isSubmitting: false,
          errorMessage: response.data.message || "Failed to send message.",
          sentMessage: "",
        });
      }
    } catch (error) {
      setFormStatus({
        isSubmitting: false,
        errorMessage: error.response?.data?.message || "An error occurred. Please try again.",
        sentMessage: "",
      });
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
              Contact Us
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 4, maxWidth: "800px", mx: "auto" }}>
              Have questions or feedback about ConfidenceVoice? Reach out to us, and we’ll respond promptly.
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
              <Typography color="text.primary">Contact</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* Contact Section */}
        <Box id="contact" sx={{ py: 6, backgroundColor: "#f5f5f5" }}>
          <Container>
            <Grid container spacing={4}>
              {/* Contact Info */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" sx={{ mb: 3 }}>
                      Get in Touch
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <LocationOn sx={{ color: theme.palette.primary.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h6">Address</Typography>
                        <Typography variant="body2" color="text.secondary">
                          123 Confidence Avenue, Speaker City, SC 54321
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Phone sx={{ color: theme.palette.primary.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h6">Call Us</Typography>
                        <Typography variant="body2" color="text.secondary">
                          +1 (987) 654-3210
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Email sx={{ color: theme.palette.primary.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h6">Email Us</Typography>
                        <Typography variant="body2" color="text.secondary">
                          support@confidencevoice.com
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Contact Form */}
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" sx={{ mb: 3 }}>
                      Send Us a Message
                    </Typography>
                    {authError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {authError}{" "}
                        <Link to="/login" style={{ color: theme.palette.primary.main }}>
                          Log in here
                        </Link>.
                      </Alert>
                    )}
                    {formStatus.errorMessage && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {formStatus.errorMessage}
                      </Alert>
                    )}
                    {formStatus.sentMessage && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        {formStatus.sentMessage}
                      </Alert>
                    )}
                    <Box component="form" onSubmit={handleSubmit}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <TextField
                              name="name"
                              label="Your Name"
                              variant="outlined"
                              value={formData.name}
                              onChange={handleChange}
                              error={!!errors.name}
                              helperText={errors.name}
                              required
                              aria-label="Your Name"
                              disabled={!isAuthenticated}
                            />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <TextField
                              name="email"
                              label="Your Email"
                              variant="outlined"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              error={!!errors.email}
                              helperText={errors.email}
                              required
                              readOnly
                              aria-label="Your Email (read-only)"
                              disabled={!isAuthenticated}
                              sx={{ backgroundColor: "#f5f5f5" }}
                            />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <TextField
                              name="subject"
                              label="Subject"
                              variant="outlined"
                              value={formData.subject}
                              onChange={handleChange}
                              error={!!errors.subject}
                              helperText={errors.subject}
                              required
                              aria-label="Subject"
                              disabled={!isAuthenticated}
                            />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <TextField
                              name="message"
                              label="Message"
                              variant="outlined"
                              multiline
                              rows={6}
                              value={formData.message}
                              onChange={handleChange}
                              error={!!errors.message}
                              helperText={errors.message}
                              required
                              aria-label="Message"
                              disabled={!isAuthenticated}
                            />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={formStatus.isSubmitting || !isAuthenticated}
                            startIcon={<Send />}
                            aria-label="Send Message"
                          >
                            {formStatus.isSubmitting ? "Sending..." : "Send Message"}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
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

export default Contact;