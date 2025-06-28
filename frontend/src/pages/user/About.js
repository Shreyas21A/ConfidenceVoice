import React from "react";
import { Link } from "react-router-dom";
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
import { ArrowForward, NavigateNext } from "@mui/icons-material";
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

function About() {
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
              About ConfidenceVoice
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 4, maxWidth: "800px", mx: "auto" }}>
              ConfidenceVoice empowers you to become a confident speaker using AI-driven analysis of your facial expressions, speech, and uploaded performances. Unlock your potential with personalized insights and progress tracking.
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
              <Typography color="text.primary">About Us</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* About Us Section */}
        <Box id="about-us" sx={{ py: 6, backgroundColor: "#f5f5f5" }}>
          <Container>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} lg={6}>
                <img
                  src="assets/img/about-2.jpg"
                  alt="ConfidenceVoice AI-Powered Analysis Illustration"
                  style={{ width: "100%", borderRadius: 12 }}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" gutterBottom>
                      Elevate Your Public Speaking
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: "italic", mb: 2 }}>
                      ConfidenceVoice uses advanced AI to analyze your video, audio, and uploaded files, providing real-time feedback to boost your speaking confidence and skills.
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      <Box component="li" sx={{ mb: 1 }}>
                        Real-time video analysis of facial expressions for visual confidence.
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        Audio analysis to evaluate speech patterns and verbal confidence.
                      </Box>
                      <Box component="li">
                        Upload past performances for detailed confidence insights.
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/coaching/video"
                        endIcon={<ArrowForward />}
                        aria-label="Try Video Confidence Analysis"
                      >
                        Try Video Analysis
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/coaching/audio"
                        endIcon={<ArrowForward />}
                        aria-label="Try Audio Confidence Analysis"
                      >
                        Try Audio Analysis
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/coaching/upload"
                        endIcon={<ArrowForward />}
                        aria-label="Try Upload Performance Analysis"
                      >
                        Try Upload Analysis
                      </Button>
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

export default About;