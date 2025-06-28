import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  styled,
  Tooltip,
} from "@mui/material";
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Sync as SyncIcon,
  VolumeOff as VolumeOffIcon,
  Lightbulb as LightbulbIcon,
} from "@mui/icons-material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Styled wave animation
const WaveContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  marginTop: "16px",
  visibility: "hidden",
  "&.visible": {
    visibility: "visible",
  },
}));

const WaveBar = styled(Box)(({ theme }) => ({
  width: "8px",
  height: "40px",
  backgroundColor: theme.palette.primary.main,
  animation: "wave 0.8s ease-in-out infinite",
  "&:nth-of-type(2)": { animationDelay: "0.1s" },
  "&:nth-of-type(3)": { animationDelay: "0.2s" },
  "&:nth-of-type(4)": { animationDelay: "0.3s" },
  "&:nth-of-type(5)": { animationDelay: "0.4s" },
  "@keyframes wave": {
    "0%, 100%": { transform: "scaleY(0.3)" },
    "50%": { transform: "scaleY(1)" },
  },
}));

// Custom theme
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
    orders: { main: "#FFBB28", dark: "#F0A500" },
    neutral: { main: "#F9FAFB", dark: "#E5E7EB" },
    chartColors: ["#1976D2", "#2E7D32", "#D32F2F", "#FFBB28", "#00C49F"],
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
const ResultCard = React.memo(({ title, icon, content }) => (
  <Fade in timeout={500}>
    <Card sx={{ height: "100%", display: "flex", alignItems: "center" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Tooltip title={title} arrow>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            {icon}
            <Typography variant="h6" sx={{ ml: 1 }} aria-label={title}>
              {title}
            </Typography>
          </Box>
        </Tooltip>
        <Typography variant="body1">{content || "None"}</Typography>
      </CardContent>
    </Card>
  </Fade>
));

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

function AudioAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");

  // Map Web Speech API errors to user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMap = {
      "no-speech": "No speech detected. Please speak clearly.",
      "audio-capture": "Microphone access denied. Please enable microphone.",
      "not-allowed": "Permission denied. Please allow microphone access.",
      "network": "Network error. Please check your internet connection.",
    };
    return errorMap[errorCode] || "Speech recognition failed. Please try again.";
  };

  // Check microphone permission
  const checkMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      console.error("Microphone permission error:", err);
      setError("Microphone access denied. Please enable in browser settings.");
      return false;
    }
  };

  // Check if user is logged in
  useEffect(() => {
    if (!userId || !token) {
      navigate("/login");
    } else {
      fetchReports();
    }
  }, [userId, token, navigate]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.interimResults = false;
      setRecognition(rec);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const response = await axios.get("http://127.0.0.1:5001/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data.map(report => ({
        ...report,
        most_repeated_words: report.most_repeated_words || report.most_repeated_word,
      })));
    } catch (err) {
      setReportsError("Failed to load reports. Please try again.");
      console.error("Reports error:", err);
    } finally {
      setReportsLoading(false);
    }
  }, [token]);

  const handleAnalyze = async () => {
    if (isRecording) {
      // Stop recording
      if (recognition) {
        recognition.stop();
      } else {
        try {
          await axios.post("http://127.0.0.1:5001/stop", {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error("Stop error:", err);
        }
      }
      setIsRecording(false);
      setLoading(false);
      return;
    }

    if (!(await checkMicPermission())) {
      setLoading(false);
      setIsRecording(false);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setIsRecording(true);

    if (recognition) {
      // Client-side transcription
      recognition.start();
      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        try {
          const response = await axios.post(
            "http://127.0.0.1:5001/analyze",
            { text: transcript },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000,
            }
          );
          if (response.data.success) {
            setResult(response.data.result);
            fetchReports();
          } else {
            setError(response.data.message || "Analysis failed.");
          }
        } catch (err) {
          setError(err.response?.data?.message || "Failed to analyze audio.");
        } finally {
          setLoading(false);
          setIsRecording(false);
        }
      };

      recognition.onerror = (event) => {
        setError(getErrorMessage(event.error));
        setLoading(false);
        setIsRecording(false);
      };
    } else {
      // Server-side transcription
      try {
        const response = await axios.post(
          "http://127.0.0.1:5001/analyze",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000,
          }
        );
        if (response.data.success) {
          setResult(response.data.result);
          fetchReports();
        } else {
          setError(response.data.message || "Analysis failed.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to analyze audio.");
      } finally {
        setLoading(false);
        setIsRecording(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <ThemeProvider theme={theme}>
      <Header onLogout={handleLogout} />
      <main style={{ padding: "2rem 0", backgroundColor: theme.palette.neutral.main, minHeight: "100vh" }}>
        <Container maxWidth="xl">
          <Typography variant="h3" align="center" gutterBottom aria-label="Real-Time Audio Analysis">
            Real-Time Audio Analysis
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" mb={4}>
            Enhance your speaking skills with real-time AI feedback.
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
                      handleAnalyze();
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
            <Grid item xs={12} md={8}>
              <Card className={isRecording ? "recording" : ""} aria-live="polite">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Record Audio
                  </Typography>
                  <Typography variant="body1" color="textSecondary" mb={3}>
                    Click below to start or stop recording your speech.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                    onClick={handleAnalyze}
                    disabled={loading && !isRecording}
                    sx={{ mb: 2 }}
                    aria-label={isRecording ? "Stop recording" : "Start recording and analyze audio"}
                  >
                    {isRecording ? "Stop Recording" : loading ? "Recording..." : "Start Recording"}
                  </Button>
                  <WaveContainer className={isRecording ? "visible" : ""} aria-hidden="true">
                    <WaveBar />
                    <WaveBar />
                    <WaveBar />
                    <WaveBar />
                    <WaveBar />
                  </WaveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {result && (
            <Grid container spacing={3} mt={4}>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Transcription"
                  icon={<DescriptionIcon color="primary" />}
                  content={result.transcribed_text}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Vocabulary Assessment"
                  icon={<BarChartIcon color="primary" />}
                  content={result.pronunciation}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Most Repeated Words"
                  icon={<SyncIcon color="primary" />}
                  content={result.most_repeated_words}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Filler Words"
                  icon={<VolumeOffIcon color="primary" />}
                  content={result.filler_words}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Suggestions"
                  icon={<LightbulbIcon color="primary" />}
                  content={result.suggestions.join(", ")}
                />
              </Grid>
            </Grid>
          )}

          <TableWrapper title="Audio Analysis Reports" loading={reportsLoading}>
            <Table aria-label="Audio analysis reports table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Pronunciation">Pronunciation</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Most Repeated Words">Most Repeated Words</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Filler Words">Filler Words</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Suggestion">Suggestion</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Date">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 && !reportsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1">No reports found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id} hover sx={{ "&:hover": { bgcolor: theme.palette.neutral.dark } }}>
                      <TableCell>{report.pronunciation || "N/A"}</TableCell>
                      <TableCell>{report.most_repeated_words || "N/A"}</TableCell>
                      <TableCell>{report.filler_words || "None"}</TableCell>
                      <TableCell>{report.suggestion || "N/A"}</TableCell>
                      <TableCell>{new Date(report.created_at).toLocaleDateString() || "N/A"}</TableCell>
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

export default AudioAnalysis;