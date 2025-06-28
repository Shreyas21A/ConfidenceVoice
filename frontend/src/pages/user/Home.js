import React, { useEffect } from "react";
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
  IconButton,
} from "@mui/material";
import { ArrowForward, ChevronRight, AutoGraph, Mic, Upload } from "@mui/icons-material";
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
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h5: { fontWeight: 700 },
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

// PureCounter animation script (simplified)
const initializePureCounter = () => {
  const counters = document.querySelectorAll(".purecounter");
  counters.forEach((counter) => {
    const start = parseInt(counter.getAttribute("data-purecounter-start"));
    const end = parseInt(counter.getAttribute("data-purecounter-end"));
    const duration = parseInt(counter.getAttribute("data-purecounter-duration")) * 1000;
    const increment = (end - start) / (duration / 50);
    let current = start;

    const updateCounter = () => {
      current += increment;
      if (current >= end) {
        counter.textContent = end;
        return;
      }
      counter.textContent = Math.floor(current);
      setTimeout(updateCounter, 50);
    };
    updateCounter();
  });
};

function Home() {
  useEffect(() => {
    initializePureCounter();
    return () => {}; // Cleanup if needed
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <main className="main">
        {/* Hero Section */}
        <Box
          id="hero"
          sx={{
            position: "relative",
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            color: "#fff",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `url("assets/img/hero-bg.jpg") no-repeat center/cover`,
              opacity: 0.6,
              zIndex: 1,
            },
          }}
        >
          <Container sx={{ position: "relative", zIndex: 2 }}>
            <Typography variant="h2" sx={{ color: "#000", mb: 2 }}>
              Boost Your Confidence with AI Coaching
            </Typography>
            <Typography variant="body1" sx={{ color: "#000", mb: 2, fontSize: "1.2rem" }}>
              ConfidenceVoice analyzes your speech and facial expressions in real time to enhance your public speaking skills.
            </Typography>
            <Typography variant="body2" sx={{ color: "#000", mb: 4, fontStyle: "italic" }}>
              Speak with confidence, backed by cutting-edge AI insights.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/coaching"
              endIcon={<ArrowForward />}
              aria-label="Start Confidence Coaching"
            >
              Start Coaching Now
            </Button>
          </Container>
        </Box>

        {/* About Section */}
        <Box id="about" sx={{ py: 6, backgroundColor: "#f5f5f5" }}>
          <Container>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} lg={6}>
                <img
                  src="assets/img/about.jpg"
                  alt="ConfidenceVoice AI Coaching Illustration"
                  style={{ width: "100%", borderRadius: 12 }}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" gutterBottom>
                      Transform Your Speaking Skills
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: "italic", mb: 2 }}>
                      ConfidenceVoice leverages AI to analyze your voice and expressions, delivering personalized feedback to build confidence.
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      <Box component="li" sx={{ mb: 1 }}>
                        Real-time video and audio analysis for instant insights.
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        Upload files to assess past performances.
                      </Box>
                      <Box component="li">
                        Track progress with detailed reports and metrics.
                      </Box>
                    </Box>
                    <Button
                      variant="text"
                      color="primary"
                      component={Link}
                      to="/about"
                      endIcon={<ArrowForward />}
                      aria-label="Discover ConfidenceVoice Features"
                    >
                      Discover More
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Why Us Section */}
        <Box id="why-us" sx={{ py: 6, backgroundColor: "#f5f5f5" }}>
          <Container>
            <Typography variant="h2" align="center" gutterBottom>
              Why ConfidenceVoice Stands Out
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 4, color: "text.secondary" }}>
              Experience a smarter way to improve your public speaking with AI-driven tools tailored to your needs.
            </Typography>
            <Grid container spacing={4}>
              {[
                {
                  icon: <AutoGraph fontSize="large" color="primary" />,
                  title: "Video Confidence Analysis",
                  description:
                    "Analyze facial expressions in real time using AI to measure and improve your visual confidence.",
                  link: "/coaching/video",
                },
                {
                  icon: <Mic fontSize="large" color="primary" />,
                  title: "Audio Confidence Analysis",
                  description:
                    "Evaluate your speech patterns and tone to enhance verbal confidence with real-time transcription.",
                  link: "/coaching/audio",
                },
                {
                  icon: <Upload fontSize="large" color="primary" />,
                  title: "Upload Performance Analysis",
                  description:
                    "Upload audio or video files to assess past performances and receive detailed confidence insights.",
                  link: "/coaching/upload",
                },
              ].map((benefit, index) => (
                <Grid item xs={12} sm={6} lg={4} key={index}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                      <IconButton sx={{ mb: 2 }} aria-label={`${benefit.title} icon`}>
                        {benefit.icon}
                      </IconButton>
                      <Typography variant="h5" gutterBottom>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefit.description}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, textAlign: "center" }}>
                      <Button
                        variant="text"
                        color="primary"
                        component={Link}
                        to={benefit.link}
                        endIcon={<ChevronRight />}
                        aria-label={`Explore ${benefit.title}`}
                      >
                        Explore Now
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default Home;