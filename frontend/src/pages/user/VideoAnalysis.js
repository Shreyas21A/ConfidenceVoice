import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ThemeProvider,
  createTheme,
  Fade,
} from "@mui/material";
import { Videocam as VideocamIcon, Stop as StopIcon, VolumeOff as VolumeOffIcon } from "@mui/icons-material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Custom theme
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
    orders: { main: "#FFBB28", dark: "#F0A500" },
    chartColors: ["#1976D2", "#2E7D32", "#D32F2F", "#FFBB28", "#00C49F"],
    neutral: { main: "#F9FAFB", dark: "#E5E7EB" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700, fontSize: "2rem" },
    h5: { fontWeight: 600, fontSize: "1.25rem" },
    body1: { fontSize: "0.95rem" },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          transition: "background-color 0.3s, transform 0.3s",
          "&.recording": {
            backgroundColor: "#E3F2FD",
            transform: "scale(1.02)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          padding: "8px 16px",
          "&:focus": { outline: "2px solid #1976D2" },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#F1F5F9",
          fontWeight: 600,
          padding: "12px",
        },
        body: { padding: "12px", fontSize: "0.9rem" },
      },
    },
  },
});

// Reusable ResultCard component
const ResultCard = ({ title, icon, content }) => (
  <Fade in timeout={500}>
    <Card sx={{ height: "100%", display: "flex", alignItems: "center" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body1">{content || "N/A"}</Typography>
      </CardContent>
    </Card>
  </Fade>
);

// Reusable TableWrapper component
const TableWrapper = ({ title, children, loading }) => (
  <Box mt={4}>
    <Typography variant="h5" mb={2} aria-label={title}>
      {title}
    </Typography>
    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    ) : (
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        {children}
      </TableContainer>
    )}
  </Box>
);

function VideoAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");

  // Check auth
  useEffect(() => {
    console.log("Checking auth - userId:", userId, "token:", token);
    if (!userId || !token) {
      console.log("Redirecting to /login");
      navigate("/login");
    } else {
      fetchReports();
    }
  }, [userId, token, navigate]);

  // Status polling during analysis
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get("http://127.0.0.1:5002/status", {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Status response:", response.data);
          if (!response.data.running) {
            clearInterval(interval);
            fetchResults();
          } else {
            setTimeRemaining(response.data.time_remaining);
          }
        } catch (err) {
          console.error("Status error:", err);
          setError("Failed to check analysis status.");
          setIsAnalyzing(false);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, token]);

  const fetchReports = async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const response = await axios.get("http://127.0.0.1:5002/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Reports response:", response.data);
      setReports(response.data.reports);
    } catch (err) {
      setReportsError("Failed to load reports. Please try again.");
      console.error("Reports error:", err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://127.0.0.1:5002/results", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Results response:", response.data);
      if (response.data.success) {
        setResult(response.data.result);
        fetchReports();
      } else {
        setError(response.data.message || "Failed to fetch results.");
      }
    } catch (err) {
      console.error("Results error:", err);
      setError(err.response?.data?.message || "Failed to fetch results.");
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
      if (videoRef.current) {
        videoRef.current.src = "";
      }
    }
  };

  const handleStartAnalysis = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setIsAnalyzing(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5002/analyze",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      console.log("Analyze response:", response.data);
      if (response.data.success) {
        setTimeRemaining(response.data.duration);
        if (videoRef.current) {
          videoRef.current.src = `http://127.0.0.1:5002/video_feed?token=${token}`;
          console.log("Video feed src set to:", videoRef.current.src);
        }
      } else {
        setError(response.data.message || "Failed to start analysis.");
        setIsAnalyzing(false);
      }
    } catch (err) {
      console.error("Analyze error:", err);
      setError(err.response?.data?.message || "Failed to start analysis.");
      setIsAnalyzing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStopAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        "http://127.0.0.1:5002/stop",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Stop response:", response.data);
      if (response.data.success) {
        setResult(response.data.result);
        fetchReports();
      } else {
        setError(response.data.message || "Failed to stop analysis.");
      }
    } catch (err) {
      console.error("Stop error:", err);
      setError(err.response?.data?.message || "Failed to stop analysis.");
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
      if (videoRef.current) {
        videoRef.current.src = "";
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("keepSignedIn");
    navigate("/login");
  };

  return (
    <ThemeProvider theme={theme}>
      <Header onLogout={handleLogout} />
      <main style={{ padding: "2rem 0", backgroundColor: theme.palette.neutral.main, minHeight: "100vh" }}>
        <Container maxWidth="xl">
          <Typography variant="h3" align="center" gutterBottom>
            Real-Time Video Analysis
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" mb={4}>
            Analyze your confidence through facial expressions and speech using your webcam.
          </Typography>

          {error && (
            <Fade in timeout={500}>
              <Alert
                severity="error"
                sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setError("");
                      handleStartAnalysis();
                    }}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            </Fade>
          )}

          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Card className={isAnalyzing ? "recording" : ""}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Video Analysis
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<VideocamIcon />}
                      onClick={handleStartAnalysis}
                      disabled={loading || isAnalyzing}
                      sx={{ mb: 2 }}
                      aria-label="Start video analysis"
                    >
                      {loading ? "Starting..." : "Start Analysis"}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      startIcon={<StopIcon />}
                      onClick={handleStopAnalysis}
                      disabled={!isAnalyzing}
                      aria-label="Stop video analysis"
                    >
                      Stop Analysis
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {isAnalyzing && (
            <Grid container spacing={3} mt={4} justifyContent="center">
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Analysis in Progress
                    </Typography>
                    <Typography variant="body1" mb={2}>
                      Time remaining: {timeRemaining.toFixed(1)} seconds
                    </Typography>
                    <img
                      ref={videoRef}
                      style={{ width: "100%", maxWidth: "640px", borderRadius: "8px" }}
                      alt="Video feed"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {result && (
            <Grid container spacing={3} mt={4}>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Visual Confidence"
                  icon={<VideocamIcon color="primary" />}
                  content={`${result.visual_confidence}%`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Verbal Confidence"
                  icon={<VideocamIcon color="primary" />}
                  content={`${result.verbal_confidence}%`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Overall Confidence"
                  icon={<VideocamIcon color="primary" />}
                  content={`${result.overall_confidence}%`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Filler Words"
                  icon={<VolumeOffIcon color="primary" />}
                  content={result.filler_words}
                />
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Analysis Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Facial Analysis</Typography>
                        <Typography variant="body2">
                          Total frames: {result.facial_analysis.total_frames}
                        </Typography>
                        <Typography variant="body2">
                          Confident frames: {result.facial_analysis.confident_frames}
                        </Typography>
                        <Typography variant="body2">
                          Not confident frames: {result.facial_analysis.not_confident_frames}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Verbal Analysis</Typography>
                        <Typography variant="body2">
                          Confident phrases: {result.verbal_analysis.confident_words}
                        </Typography>
                        <Typography variant="body2">
                          Uncertainty phrases: {result.verbal_analysis.unconfident_words}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Box mt={2}>
                      <Typography variant="h6">Speech Transcript</Typography>
                      <Typography variant="body1" sx={{ p: 2, bgcolor: "white", borderRadius: 1, border: "1px solid #ddd" }}>
                        {result.transcribed_speech}
                      </Typography>
                    </Box>
                    <Box mt={2}>
                      <Typography variant="h6">Feedback</Typography>
                      <ul>
                        {result.speech_feedback.map((feedback, index) => (
                          <li key={index}>{feedback}</li>
                        ))}
                      </ul>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          <TableWrapper title="Video Analysis Reports" loading={reportsLoading}>
            <Table aria-label="Video analysis reports table">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.neutral.dark }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Overall Confidence</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Visual Confidence</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Verbal Confidence</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Filler Words</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Transcribed Speech</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 && !reportsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1">No reports found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id} hover sx={{ "&:hover": { bgcolor: theme.palette.neutral.dark } }}>
                      <TableCell>{report.overall_confidence}%</TableCell>
                      <TableCell>{report.visual_confidence}%</TableCell>
                      <TableCell>{report.verbal_confidence}%</TableCell>
                      <TableCell>{report.filler_words || "None"}</TableCell>
                      <TableCell>{report.transcribed_speech || "N/A"}</TableCell>
                      <TableCell>{new Date(report.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableWrapper>

          {reportsError && (
            <Fade in timeout={500}>
              <Alert
                severity="error"
                sx={{ mt: 4, maxWidth: 600, mx: "auto" }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setReportsError("");
                      fetchReports();
                    }}
                  >
                    Retry
                  </Button>
                }
              >
                {reportsError}
              </Alert>
            </Fade>
          )}
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default VideoAnalysis;